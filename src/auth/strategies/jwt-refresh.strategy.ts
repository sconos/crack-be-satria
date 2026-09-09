import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';

const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
if (!jwtRefreshSecret) throw new Error('JWT_REFRESH_SECRET is not set in environment variables');

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.refresh_token ?? null,
      ignoreExpiration: false,
      secretOrKey: jwtRefreshSecret!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string }) {
    const refreshToken = req.cookies?.refresh_token;
    return { userId: payload.sub, refreshToken };
  }
}