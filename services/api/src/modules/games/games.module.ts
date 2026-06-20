import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { PragmaticPlayProvider } from './providers/pragmatic-play.provider';

@Module({
  controllers: [GamesController],
  providers: [GamesService, PragmaticPlayProvider],
  exports: [GamesService],
})
export class GamesModule {}
