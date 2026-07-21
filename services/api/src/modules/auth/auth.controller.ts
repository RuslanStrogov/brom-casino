import { Controller, Get, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email/phone and password' })
  @ApiResponse({ status: 200, description: 'Tokens returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: any) {
    const payload = req.user;
    return {
      admin: {
        id: payload.sub,
        email: payload.email || '',
        name: payload.email?.split('@')[0] || 'Admin',
        role: payload.role === 'SUPER_ADMIN' ? 'super_admin' : payload.role?.toLowerCase() || 'admin',
        permissions: ['*'],
      },
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate session' })
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.sub);
  }

  @Post('telegram')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register via Telegram' })
  async telegramAuth(@Body() dto: { telegramId: string; username?: string; firstName?: string }) {
    return this.authService.telegramAuth(dto);
  }
}
