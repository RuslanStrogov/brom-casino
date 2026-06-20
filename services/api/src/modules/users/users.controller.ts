import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '@brom-casino/shared';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile returned' })
  async getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(@Req() req: any, @Body() dto: { username?: string; firstName?: string; lastName?: string; avatarUrl?: string }) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  @Get('me/balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, description: 'Balance returned' })
  async getBalance(@Req() req: any) {
    return this.usersService.getBalance(req.user.sub);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get user gambling stats' })
  @ApiResponse({ status: 200, description: 'Stats returned' })
  async getStats(@Req() req: any) {
    return this.usersService.getStats(req.user.sub);
  }

  @Get('me/referrals')
  @ApiOperation({ summary: 'Get referral info and list' })
  @ApiResponse({ status: 200, description: 'Referrals returned' })
  async getReferrals(@Req() req: any) {
    return this.usersService.getReferrals(req.user.sub);
  }

  @Get('me/transactions')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiOperation({ summary: 'Get user transaction history' })
  async getTransactions(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type?: string,
  ) {
    return this.usersService.getTransactions(req.user.sub, { page, limit, type });
  }

  @Get('me/bets')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Get user bet history' })
  async getBetHistory(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getBetHistory(req.user.sub, { page, limit });
  }

  // Admin endpoints
  @Get()
  @ApiOperation({ summary: 'List all users (Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async listUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.listUsers({ page, limit, status, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Admin)' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status (Admin)' })
  async updateUserStatus(@Param('id') id: string, @Body() dto: { status: string; reason?: string }, @Req() req: any) {
    return this.usersService.updateUserStatus(id, dto, req.user.sub);
  }

  @Patch(':id/vip')
  @ApiOperation({ summary: 'Update user VIP level (Admin)' })
  async updateVipLevel(@Param('id') id: string, @Body() dto: { vipLevel: number }) {
    return this.usersService.updateVipLevel(id, dto.vipLevel);
  }
}
