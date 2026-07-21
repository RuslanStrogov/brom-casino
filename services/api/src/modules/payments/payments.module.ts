import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CryptomusPsp } from './providers/cryptomus.psp';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, CryptomusPsp],
  exports: [PaymentsService],
})
export class PaymentsModule {}
