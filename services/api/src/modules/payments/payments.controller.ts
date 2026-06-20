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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
    @Body() dto: { amount: string; currency?: string; paymentMethod?: string },
  ) {
    return this.paymentsService.createDeposit(req.user.sub, dto);
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

  @Post('webhook/:provider')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment provider webhook (public)' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Headers('x-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(provider, payload, signature);
  }
}
