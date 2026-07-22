import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CryptomusPsp } from './providers/cryptomus.psp';
import { SbpPsp } from './providers/sbp.psp';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, CryptomusPsp, SbpPsp],
  exports: [PaymentsService],
})
export class PaymentsModule {}
