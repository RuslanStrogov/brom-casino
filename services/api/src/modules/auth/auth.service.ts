import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload, Role } from '@brom-casino/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: { email?: string; phone?: string; password: string; username?: string; referralCode?: string }) {
    // TODO: Check if user exists in DB via Prisma
    // TODO: Hash password
    // TODO: Create user with wallet
    // TODO: Handle referral

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Placeholder — will be replaced with Prisma call
    const user = {
      id: uuidv4(),
      email: dto.email,
      phone: dto.phone,
      username: dto.username,
      passwordHash,
      role: Role.PLAYER,
      createdAt: new Date(),
    };

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
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
    // TODO: Find user in DB via Prisma
    // TODO: Verify password
    // TODO: Check if user is banned/suspended

    // Placeholder
    const user = {
      id: uuidv4(),
      email: dto.email,
      role: Role.PLAYER,
    };

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
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
    // TODO: Find or create user by telegramId
    const user = {
      id: uuidv4(),
      telegramId: dto.telegramId,
      username: dto.username,
      role: Role.PLAYER,
    };

    const tokens = await this.generateTokens({
      sub: user.id,
      role: user.role,
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
