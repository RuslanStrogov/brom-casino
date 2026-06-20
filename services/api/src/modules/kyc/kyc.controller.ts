import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('kyc')
@ApiBearerAuth()
@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get current KYC status' })
  @ApiResponse({ status: 200, description: 'KYC status returned' })
  async getStatus(@Req() req: any) {
    return this.kycService.getStatus(req.user.sub);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit KYC documents' })
  @ApiResponse({ status: 201, description: 'KYC submitted for review' })
  async submit(
    @Req() req: any,
    @Body() dto: {
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
    return this.kycService.submit(req.user.sub, dto);
  }

  @Get('limits')
  @ApiOperation({ summary: 'Get deposit/withdrawal limits based on KYC level' })
  async getLimits() {
    return this.kycService.getLimits();
  }

  // Admin endpoints
  @Get('admin/pending')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'List pending KYC verifications (Admin)' })
  async listPending(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.kycService.listPending({ page, limit });
  }

  @Post('admin/review/:userId')
  @ApiOperation({ summary: 'Review KYC verification (Admin)' })
  async review(
    @Param('userId') userId: string,
    @Body() dto: { action: 'approve' | 'reject'; notes?: string },
    @Req() req: any,
  ) {
    return this.kycService.review(userId, dto, req.user.sub);
  }
}
