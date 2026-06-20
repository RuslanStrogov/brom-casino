import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { SumsubProvider } from './providers/sumsub.provider';

@Module({
  controllers: [KycController],
  providers: [KycService, SumsubProvider],
  exports: [KycService],
})
export class KycModule {}
