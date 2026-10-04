import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('easter-egg')
@Controller('easter-egg')
export class EasterEggController {
  @Get('jackpot')
  @ApiOperation({ summary: 'Секретный джекпот (пасхалка)' })
  jackpot() {
    return {
      message: 'ДЖЕКПОТ! Ты нашёл секретную комбинацию!',
      combination: ['7', '7', '7'],
      prize: 'Бесплатная игра — удача на твоей стороне',
      hint: 'Попробуй найти эту комбинацию в рулетке...',
    };
  }

  @Get('cheat-codes')
  @ApiOperation({ summary: 'Секретные коды (пасхалка)' })
  cheatCodes() {
    return [
      { code: 'UPUPDOWN', effect: '+1000 кредитов' },
      { code: 'LUCKY7', effect: 'Гарантированный выигрыш' },
      { code: 'BROMSECRET', effect: 'Раскрыть секреты казино' },
    ];
  }
}
