import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { JwtPayload, Role } from '@brom-casino/shared';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: { email?: string; phone?: string; password: string; username?: string; referralCode?: string }) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        username: dto.username,
        passwordHash,
        role: Role.PLAYER,
        status: 'ACTIVE',
      },
    });

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email!,
      role: user.role as unknown as Role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(dto: { email?: string; phone?: string; password: string }) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { phone: dto.phone },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is suspended');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email!,
      role: user.role as unknown as Role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
      });

      const tokens = await this.generateTokens({
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // TODO: Invalidate session in DB/Redis
    return { success: true };
  }

  async telegramAuth(dto: { telegramId: string; username?: string; firstName?: string }) {
    let user = await this.prisma.user.findUnique({
      where: { telegramId: dto.telegramId },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          telegramId: dto.telegramId,
          username: dto.username,
          firstName: dto.firstName,
          role: Role.PLAYER,
          status: 'ACTIVE',
        },
      });
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      role: user.role as unknown as Role,
    });

    return {
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        role: user.role,
      },
      ...tokens,
    };
  }

  private async generateTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
}
