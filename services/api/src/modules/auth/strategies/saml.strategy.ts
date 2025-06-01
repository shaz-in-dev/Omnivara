import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile, type VerifiedCallback } from '@node-saml/passport-saml';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * SAML 2.0 strategy for enterprise SSO.
 *
 * Config is loaded dynamically per-request based on the org's SsoConfig record.
 * The static defaults here are overridden at runtime via the dynamic-config pattern.
 *
 * Flow:
 *   GET  /auth/sso/saml/login       → redirect to IdP
 *   POST /auth/sso/saml/callback    → IdP posts assertion here
 *   GET  /auth/sso/saml/metadata    → SP metadata XML for IdP setup
 */
@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, 'saml') {
  constructor(private readonly prisma: PrismaService) {
    super(
      {
        // Placeholder — real per-org config loaded in SsoController
        entryPoint: process.env.SAML_ENTRY_POINT ?? 'https://idp.example.com/sso',
        issuer:     process.env.SAML_ISSUER     ?? 'omnivara',
        idpCert:    process.env.SAML_CERT       ?? '',
        callbackUrl: `${process.env.API_URL ?? 'http://localhost:4000'}/auth/sso/saml/callback`,
        wantAuthnResponseSigned: false,
        acceptedClockSkewMs: 5000,
      },
      async (profile: Profile, done: VerifiedCallback) => {
        try {
          const email =
            (profile.nameID ?? profile.email ?? (profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] as string))?.toLowerCase();

          if (!email) {
            return done(new UnauthorizedException('No email in SAML assertion'), null as unknown as Record<string, unknown>);
          }

          // Upsert user from SSO assertion
          const user = await this.prisma.user.upsert({
            where: { email },
            update: {
              name: (profile.displayName ?? profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] as string ?? email),
              lastLoginAt: new Date(),
            },
            create: {
              email,
              emailVerified: true, // SSO-verified users skip email verification
              name: String(profile.displayName ?? (email.split('@')[0] || email)),
            },
          });

          return done(null, user as unknown as Record<string, unknown>);
        } catch (err) {
          return done(err as Error, null as unknown as Record<string, unknown>);
        }
      },
    );
  }

  /**
   * Returns the raw user object from validate callback.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override authenticate(req: any, options?: any) {
    super.authenticate(req, options);
  }
}
