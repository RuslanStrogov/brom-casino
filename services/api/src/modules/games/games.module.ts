import { Module, forwardRef } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { PragmaticPlayProvider } from './providers/pragmatic-play.provider';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [forwardRef(() => WalletModule)],
  controllers: [GamesController],
  providers: [GamesService, PragmaticPlayProvider],
  exports: [GamesService],
})
export class GamesModule {}
