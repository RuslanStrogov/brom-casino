import {
  Controller,
  Get,
  Post,
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
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Public()
  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'provider', required: false, type: String })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOperation({ summary: 'List all available games' })
  @ApiResponse({ status: 200, description: 'Games list returned' })
  async listGames(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('category') category?: string,
    @Query('provider') provider?: string,
    @Query('featured') featured?: boolean,
    @Query('search') search?: string,
  ) {
    return this.gamesService.listGames({ page, limit, category, provider, featured, search });
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'List game categories' })
  async getCategories() {
    return this.gamesService.getCategories();
  }

  @Public()
  @Get('providers')
  @ApiOperation({ summary: 'List game providers' })
  async getProviders() {
    return this.gamesService.getProviders();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get game details by slug' })
  @ApiResponse({ status: 200, description: 'Game details returned' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async getGame(@Param('slug') slug: string) {
    return this.gamesService.getGame(slug);
  }

  @Post(':slug/launch')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Launch a game session' })
  @ApiResponse({ status: 200, description: 'Game session launched' })
  @ApiResponse({ status: 402, description: 'Insufficient balance' })
  async launchGame(
    @Param('slug') slug: string,
    @Req() req: any,
    @Body() dto: { mode?: 'real' | 'demo' } = { mode: 'real' },
  ) {
    return this.gamesService.launchGame(req.user.sub, slug, dto.mode || 'real');
  }

  @Post(':slug/spin')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute a spin (for in-house games)' })
  async spin(
    @Param('slug') slug: string,
    @Req() req: any,
    @Body() dto: { betAmount: string; lines?: number },
  ) {
    return this.gamesService.spin(req.user.sub, slug, dto);
  }

  @Get('session/:sessionToken')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get game session details' })
  async getSession(@Param('sessionToken') sessionToken: string, @Req() req: any) {
    return this.gamesService.getSession(sessionToken, req.user.sub);
  }

  /**
   * Get Pragmatic Play launch URL for a specific game.
   * Frontend uses this to construct the iframe src.
   */
  @Post('pragmatic-play/:gameId/url')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Pragmatic Play game launch URL' })
  async getPragmaticPlayUrl(
    @Param('gameId') gameId: string,
    @Req() req: any,
    @Body() dto: { mode?: 'real' | 'demo'; currency?: string; language?: string } = {},
  ) {
    return this.gamesService.getPragmaticPlayLaunchUrl(
      req.user.sub,
      gameId,
      dto.mode || 'demo',
      dto.currency || 'USDT',
      dto.language || 'en',
    );
  }
}
