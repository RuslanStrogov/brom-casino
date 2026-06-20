import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { KycStatus, PaginationMeta } from '@brom-casino/shared';
import { SumsubProvider } from './providers/sumsub.provider';

interface KycLimits {
  level: number;
  name: string;
  dailyDepositLimit: number;
  dailyWithdrawalLimit: number;
  monthlyWithdrawalLimit: number;
  requirements: string[];
}

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  private readonly limits: KycLimits[] = [
    {
      level: 0,
      name: 'Unverified',
      dailyDepositLimit: 500,
      dailyWithdrawalLimit: 0,
      monthlyWithdrawalLimit: 0,
      requirements: [],
    },
    {
      level: 1,
      name: 'Basic',
      dailyDepositLimit: 5000,
      dailyWithdrawalLimit: 2000,
      monthlyWithdrawalLimit: 20000,
      requirements: ['Email verification', 'Phone verification', 'ID document'],
    },
    {
      level: 2,
      name: 'Full',
      dailyDepositLimit: 50000,
      dailyWithdrawalLimit: 10000,
      monthlyWithdrawalLimit: 100000,
      requirements: ['All basic requirements', 'Proof of address', 'Selfie verification'],
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly sumsubProvider: SumsubProvider,
  ) {}

  async getStatus(userId: string) {
    const kyc = await this.prisma.kycVerification.findUnique({ where: { userId } });

    if (!kyc) {
      return {
        status: KycStatus.PENDING,
        level: 0,
        limits: this.limits[0],
        message: 'KYC not submitted',
      };
    }

    return {
      status: kyc.status,
      level: kyc.level,
      limits: this.limits[kyc.level] || this.limits[0],
      documentType: kyc.documentType,
      country: kyc.country,
      submittedAt: kyc.submittedAt,
      reviewedAt: kyc.reviewedAt,
      reviewNotes: kyc.reviewNotes,
    };
  }

  async getLimits() {
    return this.limits;
  }

  async submit(
    userId: string,
    dto: {
      documentType: string;
      documentNumber: string;
      documentFrontUrl: string;
      documentBackUrl?: string;
      selfieUrl: string;
      country?: string;
      dateOfBirth?: string;
      proofOfAddressUrl?: string;
    },
  ) {
    const existing = await this.prisma.kycVerification.findUnique({ where: { userId } });

    if (existing && existing.status === KycStatus.IN_PROGRESS) {
      throw new ConflictException('KYC verification already in progress');
    }

    if (existing && existing.status === KycStatus.APPROVED) {
      throw new ConflictException('KYC already verified');
    }

    // Determine KYC level based on documents provided
    let level = 1; // Basic with ID + selfie
    if (dto.proofOfAddressUrl) {
      level = 2; // Full with proof of address
    }

    const kyc = await this.prisma.kycVerification.upsert({
      where: { userId },
      create: {
        userId,
        status: KycStatus.IN_PROGRESS,
        level,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        documentFrontUrl: dto.documentFrontUrl,
        documentBackUrl: dto.documentBackUrl,
        selfieUrl: dto.selfieUrl,
        country: dto.country,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        proofOfAddressUrl: dto.proofOfAddressUrl,
        submittedAt: new Date(),
      },
      update: {
        status: KycStatus.IN_PROGRESS,
        level,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        documentFrontUrl: dto.documentFrontUrl,
        documentBackUrl: dto.documentBackUrl,
        selfieUrl: dto.selfieUrl,
        country: dto.country,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        proofOfAddressUrl: dto.proofOfAddressUrl,
        submittedAt: new Date(),
        reviewNotes: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'KYC_SUBMIT',
        entity: 'KycVerification',
        entityId: kyc.id,
        newValue: { level, documentType: dto.documentType },
      },
    });

    this.logger.log(`User ${userId} submitted KYC level ${level}`);
    return {
      id: kyc.id,
      status: kyc.status,
      level: kyc.level,
      message: 'KYC documents submitted successfully. Review may take 24-48 hours.',
    };
  }

  async listPending(opts: { page: number; limit: number }) {
    const [verifications, total] = await Promise.all([
      this.prisma.kycVerification.findMany({
        where: { status: KycStatus.IN_PROGRESS },
        include: {
          user: {
            select: { id: true, username: true, email: true, createdAt: true },
          },
        },
        orderBy: { submittedAt: 'asc' },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      this.prisma.kycVerification.count({ where: { status: KycStatus.IN_PROGRESS } }),
    ]);

    const meta: PaginationMeta = {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.ceil(total / opts.limit),
    };

    return { verifications, meta };
  }

  async review(
    userId: string,
    dto: { action: 'approve' | 'reject'; notes?: string },
    reviewerId: string,
  ) {
    const kyc = await this.prisma.kycVerification.findUnique({ where: { userId } });
    if (!kyc) throw new NotFoundException('KYC verification not found');
    if (kyc.status !== KycStatus.IN_PROGRESS) {
      throw new BadRequestException(`Cannot review KYC with status: ${kyc.status}`);
    }

    const newStatus = dto.action === 'approve' ? KycStatus.APPROVED : KycStatus.REJECTED;

    const updated = await this.prisma.kycVerification.update({
      where: { userId },
      data: {
        status: newStatus,
        reviewedBy: reviewerId,
        reviewNotes: dto.notes,
        reviewedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: reviewerId,
        action: `KYC_${dto.action.toUpperCase()}`,
        entity: 'KycVerification',
        entityId: kyc.id,
        oldValue: { status: KycStatus.IN_PROGRESS },
        newValue: { status: newStatus, notes: dto.notes },
      },
    });

    this.logger.log(`KYC for user ${userId} ${dto.action}ed by ${reviewerId}`);
    return {
      id: updated.id,
      status: updated.status,
      level: updated.level,
      message: `KYC ${dto.action}ed successfully`,
    };
  }
}
