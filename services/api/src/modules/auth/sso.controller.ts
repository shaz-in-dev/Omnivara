import {
  Controller, Get, Post, Body, Param, Patch, Delete,
  UseGuards, Req, Res, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import { CurrentOrg } from '../../common';

/**
 * SSO / SAML routes:
 *
 *   GET  /auth/sso/saml/login         → redirect to IdP login URL
 *   POST /auth/sso/saml/callback       → IdP POST assertion → issue JWT → redirect to app
 *   GET  /auth/sso/saml/metadata       → SP metadata XML
 *   GET  /auth/sso/config              → get current org SSO config (authenticated)
 *   POST /auth/sso/config              → save org SSO config (authenticated)
 *   DELETE /auth/sso/config            → delete / disable SSO (authenticated)
 */
@ApiTags('SSO')
@Controller('auth/sso')
export class SsoController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /* ── SP Metadata ─────────────────────────────────────────────────────────── */

  @Get('saml/metadata')
  @ApiOperation({ summary: 'SAML SP metadata XML' })
  getMetadata(@Req() req: Request, @Res() res: Response) {
    const apiUrl = process.env.API_URL ?? 'http://localhost:4000';
    const xml = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="${apiUrl}">
  <SPSSODescriptor
    AuthnRequestsSigned="false"
    WantAssertionsSigned="true"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${apiUrl}/auth/sso/saml/callback"
      index="1"/>
  </SPSSODescriptor>
</EntityDescriptor>`;

    res.setHeader('Content-Type', 'application/xml');
    res.status(HttpStatus.OK).send(xml);
  }

  /* ── SAML Login — redirect to IdP ────────────────────────────────────────── */

  @Get('saml/login')
  @ApiOperation({ summary: 'Initiate SAML SSO login (redirect to IdP)' })
  @UseGuards(AuthGuard('saml'))
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  samlLogin() {
    // Passport redirects to IdP — nothing to do here
  }

  /* ── SAML Callback — IdP POSTs assertion ─────────────────────────────────── */

  @Post('saml/callback')
  @ApiOperation({ summary: 'SAML SSO callback (IdP posts assertion here)' })
  @UseGuards(AuthGuard('saml'))
  async samlCallback(@Req() req: Request & { user?: { id: string } }, @Res() res: Response) {
    const user = req.user;
    if (!user?.id) {
      return res.redirect(`${process.env.APP_URL ?? 'http://localhost:3000'}/auth/login?error=sso_failed`);
    }

    const { accessToken } = await this.authService.login(user.id);
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    // Use fragment (#) not query param — fragments never reach server logs, CDN logs, or Referer headers
    res.redirect(`${appUrl}/auth/sso-callback#token=${encodeURIComponent(accessToken)}`);
  }

  /* ── SSO Config CRUD (admin-only) ────────────────────────────────────────── */

  @Get('config')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get SSO configuration for the org' })
  async getConfig(@CurrentOrg() orgId: string) {
    const config = await this.prisma.ssoConfig.findUnique({ where: { orgId } });
    if (!config) return { configured: false };
    // Never return the full cert in the response
    return {
      configured: true,
      provider:   config.provider,
      entryPoint: config.entryPoint,
      issuer:     config.issuer,
      enabled:    config.enabled,
      certHint:   config.cert ? `...${config.cert.slice(-20)}` : null,
    };
  }

  @Post('config')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Save SSO configuration for the org' })
  async saveConfig(
    @CurrentOrg() orgId: string,
    @Body() body: { entryPoint: string; issuer: string; cert: string; provider?: string },
  ) {
    return this.prisma.ssoConfig.upsert({
      where:  { orgId },
      create: { orgId, ...body, provider: body.provider ?? 'saml' },
      update: { ...body },
      select: { id: true, provider: true, entryPoint: true, issuer: true, enabled: true },
    });
  }

  @Patch('config/toggle')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Enable or disable SSO for the org' })
  async toggleSso(@CurrentOrg() orgId: string, @Body() body: { enabled: boolean }) {
    return this.prisma.ssoConfig.update({
      where:  { orgId },
      data:   { enabled: body.enabled },
      select: { id: true, enabled: true },
    });
  }

  @Delete('config')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete SSO configuration for the org' })
  async deleteConfig(@CurrentOrg() orgId: string) {
    await this.prisma.ssoConfig.deleteMany({ where: { orgId } });
    return { deleted: true };
  }
}
