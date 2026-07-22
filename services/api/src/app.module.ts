import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GamesModule } from './modules/games/games.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BonusesModule } from './modules/bonuses/bonuses.module';
import { KycModule } from './modules/kyc/kyc.module';
import { AdminModule } from './modules/admin/admin.module';
import { GameGateway } from './gateways/game.gateway';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    GamesModule,
    WalletModule,
    PaymentsModule,
    BonusesModule,
    KycModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, GameGateway],
  exports: [GameGateway],
})
export class AppModule {}
