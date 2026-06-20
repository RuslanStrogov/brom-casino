import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CryptomusPsp } from './providers/cryptomus.psp';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, CryptomusPsp],
  exports: [PaymentsService],
})
export class PaymentsModule {}
