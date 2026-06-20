import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { GameGateway } from './gateways/game.gateway';
import { ChatGateway } from './gateways/chat.gateway';
import { SlotEngine } from './games/slot/slot.engine';
import { CrashEngine } from './games/crash/crash.engine';
import { DiceEngine } from './games/dice/dice.engine';
import { PlinkoEngine } from './games/plinko/plinko.engine';
import { RngService } from './rng/rng.service';
import { SessionManager } from './session/session.manager';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'brom-casino-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    GameGateway,
    ChatGateway,
    SlotEngine,
    CrashEngine,
    DiceEngine,
    PlinkoEngine,
    RngService,
    SessionManager,
  ],
})
export class GameServerModule {}
