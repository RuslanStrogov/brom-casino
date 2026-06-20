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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BonusesService } from './bonuses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('bonuses')
@Controller('bonuses')
export class BonusesController {
  constructor(private readonly bonusesService: BonusesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available bonuses for current user' })
  async getAvailableBonuses(@Req() req: any) {
    return this.bonusesService.getAvailableBonuses(req.user.sub);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user active bonuses' })
  async getMyBonuses(@Req() req: any) {
    return this.bonusesService.getUserBonuses(req.user.sub);
  }

  @Post('claim/:bonusId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim a bonus' })
  @ApiResponse({ status: 200, description: 'Bonus claimed' })
  @ApiResponse({ status: 400, description: 'Cannot claim bonus' })
  async claimBonus(@Param('bonusId') bonusId: string, @Req() req: any) {
    return this.bonusesService.claimBonus(req.user.sub, bonusId);
  }

  @Post('claim-by-code')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim a bonus by promo code' })
  async claimByCode(@Req() req: any, @Body() dto: { code: string }) {
    return this.bonusesService.claimByCode(req.user.sub, dto.code);
  }

  @Post('cancel/:userBonusId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an active bonus' })
  async cancelBonus(@Param('userBonusId') userBonusId: string, @Req() req: any) {
    return this.bonusesService.cancelBonus(req.user.sub, userBonusId);
  }

  // Admin endpoints
  @Get('admin/list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'List all bonuses (Admin)' })
  async listAllBonuses(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.bonusesService.listAllBonuses({ page, limit });
  }

  @Post('admin/create')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new bonus (Admin)' })
  async createBonus(@Body() dto: any, @Req() req: any) {
    return this.bonusesService.createBonus(dto, req.user.sub);
  }

  @Post('admin/give/:userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Give bonus to specific user (Admin)' })
  async giveBonus(
    @Param('userId') userId: string,
    @Body() dto: { bonusId: string },
    @Req() req: any,
  ) {
    return this.bonusesService.claimBonus(userId, dto.bonusId, req.user.sub);
  }
}
