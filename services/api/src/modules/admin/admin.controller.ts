import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Dashboard
  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  // User management
  @Get('users')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOperation({ summary: 'List all users' })
  async listUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers({ page, limit, status, search });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id/balance')
  @ApiOperation({ summary: 'Adjust user balance (Admin)' })
  async adjustBalance(
    @Param('id') id: string,
    @Body() dto: { amount: string; reason: string; type: 'credit' | 'debit' },
    @Req() req: any,
  ) {
    return this.adminService.adjustBalance(id, dto, req.user.sub);
  }

  // Game management
  @Get('games')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'List all games (Admin)' })
  async listGames(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.adminService.listGames({ page, limit });
  }

  @Post('games/sync')
  @ApiOperation({ summary: 'Sync games from providers' })
  async syncGames() {
    return this.adminService.syncGames();
  }

  @Patch('games/:id')
  @ApiOperation({ summary: 'Update game settings' })
  async updateGame(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateGame(id, dto);
  }

  // Payment management
  @Get('deposits/pending')
  @ApiOperation({ summary: 'List pending deposits' })
  async listPendingDeposits() {
    return this.adminService.listPendingDeposits();
  }

  @Get('withdrawals/pending')
  @ApiOperation({ summary: 'List pending withdrawals' })
  async listPendingWithdrawals() {
    return this.adminService.listPendingWithdrawals();
  }

  @Post('withdrawals/:id/process')
  @ApiOperation({ summary: 'Process a withdrawal' })
  async processWithdrawal(
    @Param('id') id: string,
    @Body() dto: { action: 'approve' | 'reject'; notes?: string },
    @Req() req: any,
  ) {
    return this.adminService.processWithdrawal(id, dto, req.user.sub);
  }

  // Audit logs
  @Get('audit-logs')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiOperation({ summary: 'View audit logs' })
  async getAuditLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getAuditLogs({ page, limit, action, userId });
  }

  // Reports
  @Get('reports/revenue')
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiOperation({ summary: 'Get revenue report' })
  async getRevenueReport(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminService.getRevenueReport({ from, to });
  }

  @Get('reports/games')
  @ApiOperation({ summary: 'Get game performance report' })
  async getGameReport() {
    return this.adminService.getGameReport();
  }
}
