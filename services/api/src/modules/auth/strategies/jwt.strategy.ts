import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import type { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  orgId?: string;
}

export interface CurrentUserPayload {
  id:        string;
  email:     string;
  name:      string;
  avatarUrl: string | null;
  orgId?:    string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Accept Bearer token in Authorization header OR `?token=` query param (needed for SSE/EventSource)
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => (req.query['token'] as string | undefined) ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey:      config.get<string>('jwt.secret', 'dev-secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload & { sub: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });
    if (!user) throw new UnauthorizedException();
    return { ...user, orgId: payload.orgId, sub: payload.sub };
  }
}
