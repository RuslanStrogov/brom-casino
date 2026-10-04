import { Module } from '@nestjs/common';
import { EasterEggController } from './easter-egg.controller';

@Module({
  controllers: [EasterEggController],
})
export class EasterEggModule {}
