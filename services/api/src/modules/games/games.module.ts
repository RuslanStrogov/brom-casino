import { Module, forwardRef } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { PragmaticPlayProvider } from './providers/pragmatic-play.provider';
import { EvolutionProvider } from './providers/evolution.provider';
import { SpribeProvider } from './providers/spribe.provider';
import { GenericProvider } from './providers/generic.provider';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [forwardRef(() => WalletModule)],
  controllers: [GamesController],
  providers: [
    GamesService,
    PragmaticPlayProvider,
    EvolutionProvider,
    SpribeProvider,
    GenericProvider,
  ],
  exports: [GamesService],
})
export class GamesModule {}
