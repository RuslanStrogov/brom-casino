import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Headers,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('deposits')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Get deposit history' })
  async getDeposits(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.paymentsService.getDeposits(req.user.sub, { page, limit });
  }

  @Post('deposits')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a deposit' })
  @ApiResponse({ status: 201, description: 'Deposit created' })
  async createDeposit(
    @Req() req: any,
    @Body() dto: { amount: string; currency?: string; paymentMethod?: string; fiatCurrency?: string; bankName?: string; bankId?: string },
  ) {
    return this.paymentsService.createDeposit(req.user.sub, dto);
  }

  @Get('methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available payment methods' })
  @ApiResponse({ status: 200, description: 'Payment methods' })
  async getPaymentMethods() {
    return this.paymentsService.getPaymentMethods();
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Get combined transaction history' })
  async getTransactions(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.paymentsService.getTransactions(req.user.sub, { page, limit });
  }

  @Get('withdrawals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Get withdrawal history' })
  async getWithdrawals(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.paymentsService.getWithdrawals(req.user.sub, { page, limit });
  }

  @Post('withdrawals')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request a withdrawal' })
  @ApiResponse({ status: 201, description: 'Withdrawal request created' })
  async createWithdrawal(
    @Req() req: any,
    @Body() dto: { amount: string; currency?: string; destination: string; paymentMethod?: string },
  ) {
    return this.paymentsService.createWithdrawal(req.user.sub, dto);
  }

  // ===================================================================
  // Webhook Endpoints — Production-ready with signature validation
  // ===================================================================

  /**
   * Cryptomus webhook callback
   * POST /api/payments/webhook/cryptomus
   *
   * Cryptomus sends:
   *   Headers: sign (MD5 signature)
   *   Body: JSON with order_id, amount, status, uuid, etc.
   *
   * Security: validated via MD5( base64(sorted_json) + api_key )
   */
  @Post('webhook/cryptomus')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cryptomus payment webhook (public)' })
  async handleCryptomusWebhook(
    @Body() payload: any,
    @Headers('sign') signature: string,
    @Ip() ip: string,
  ) {
    this.paymentsService.logWebhookAttempt('cryptomus', ip);
    return this.paymentsService.handleWebhook('cryptomus', payload, signature || '');
  }

  /**
   * Pragmatic Play game webhook callback
   * POST /api/payments/webhook/pragmatic-play
   *
   * PP sends:
   *   Headers: X-PragmaticPlay-Signature (HMAC-SHA256)
   *   Body: JSON with transactionId, roundId, amount, type, playerId, etc.
   *
   * Security: validated via HMAC-SHA256( body, secret_key )
   */
  @Post('webhook/pragmatic-play')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pragmatic Play game webhook (public)' })
  async handlePragmaticPlayWebhook(
    @Body() payload: any,
    @Headers('x-pragmaticplay-signature') signature: string,
    @Ip() ip: string,
  ) {
    this.paymentsService.logWebhookAttempt('pragmatic-play', ip);
    return this.paymentsService.handlePragmaticPlayWebhook(payload, signature || '');
  }

  /**
   * Sumsub KYC webhook callback
   * POST /api/payments/webhook/sumsub
   *
   * Sumsub sends review results (approved/rejected) for KYC applicants
   */
  @Post('webhook/sumsub')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sumsub KYC webhook (public)' })
  async handleSumsubWebhook(
    @Body() payload: any,
    @Headers('x-sumsub-signature') signature: string,
    @Ip() ip: string,
  ) {
    this.paymentsService.logWebhookAttempt('sumsub', ip);
    return this.paymentsService.handleSumsubWebhook(payload, signature || '');
  }

  /**
   * Generic webhook endpoint (legacy fallback)
   * POST /api/payments/webhook/:provider
   */
  @Post('webhook/:provider')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleGenericWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Headers('x-signature') signature: string,
    @Ip() ip: string,
  ) {
    this.paymentsService.logWebhookAttempt(provider, ip);
    return this.paymentsService.handleWebhook(provider, payload, signature || '');
  }

  // ===================================================================
  // Health check (for monitoring / uptime)
  // ===================================================================

  @Get('health')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment service health check' })
  async health() {
    return { status: 'ok', service: 'payments', timestamp: new Date().toISOString() };
  }
}
