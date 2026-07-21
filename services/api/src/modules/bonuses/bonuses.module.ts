import { Module } from '@nestjs/common';
import { BonusesController } from './bonuses.controller';
import { BonusesService } from './bonuses.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [BonusesController],
  providers: [BonusesService],
  exports: [BonusesService],
})
export class BonusesModule {}
