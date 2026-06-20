import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

@Injectable()
export class TelegramStrategy extends PassportStrategy(Strategy, 'telegram') {
  constructor() {
    super();
  }

  async validate(telegramId: string): Promise<any> {
    // TODO: Find user by telegramId in DB
    return null;
  }
}
