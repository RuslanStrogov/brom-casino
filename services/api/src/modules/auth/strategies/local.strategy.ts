import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor() {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    // TODO: Find user in DB via Prisma
    // TODO: Verify password with bcrypt.compare
    // TODO: Return user object or throw UnauthorizedException
    return null;
  }
}
