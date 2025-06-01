import {
  Injectable, UnauthorizedException, ConflictException,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { StorageService } from '../storage/storage.service';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
    private readonly storage: StorageService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  async login(userId: string, orgId?: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { orgs: { include: { role: true, org: true } } },
    });

    // Auto-resolve orgId from the user's primary (first) membership when not explicitly provided.
    // Without this, JWT has no orgId and TenantGuard blocks every org-scoped endpoint.
    const resolvedOrgId = orgId ?? user.orgs[0]?.orgId;
    const payload = { sub: user.id, email: user.email, orgId: resolvedOrgId };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt },
    });

    const { passwordHash: _, ...safeUser } = user as typeof user & { passwordHash?: string };
    return { accessToken, refreshToken, user: safeUser };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email: dto.email, name: dto.name, passwordHash },
      });

      // Create personal org
      const slug = dto.orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const adminRole = await tx.role.create({
        data: {
          name: 'Admin',
          description: 'Full access',
          permissions: ['*'],
          isSystem: true,
          orgId: null,
        },
      });

      const org = await tx.organization.create({
        data: { name: dto.orgName, slug: `${slug}-${newUser.id.slice(0, 6)}` },
      });

      await tx.organizationMember.create({
        data: { orgId: org.id, userId: newUser.id, roleId: adminRole.id },
      });

      return newUser;
    });

    return this.login(user.id);
  }

  async refreshTokens(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    return this.login(stored.userId);
  }

  async logout(token: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { revoked: true },
    });
    return { message: 'Logged out successfully' };
  }

  /* ── Forgot / reset password ─────────────────────────────────────────── */

  async forgotPassword(userEmail: string) {
    const user = await this.prisma.user.findUnique({ where: { email: userEmail } });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { token, expiresAt, used: false },
      create: { userId: user.id, token, expiresAt },
    });

    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;
    await this.email.sendPasswordResetEmail({
      recipientEmail: user.email,
      recipientName: user.name ?? 'User',
      resetUrl,
      expiresInMinutes: 60,
    });

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.used || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
      // Revoke all existing refresh tokens for security
      this.prisma.refreshToken.updateMany({ where: { userId: record.userId }, data: { revoked: true } }),
    ]);

    return { message: 'Password updated successfully' };
  }

  /* ── Email verification ───────────────────────────────────────────────── */

  async sendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.emailVerified) return { message: 'Email already verified' };

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.emailVerifyToken.upsert({
      where: { userId: user.id },
      update: { token, expiresAt },
      create: { userId: user.id, token, expiresAt },
    });

    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const verifyUrl = `${appUrl}/auth/verify-email?token=${token}`;
    await this.email.sendWelcomeEmail({
      recipientEmail: user.email,
      recipientName: user.name ?? 'User',
      orgName: 'Omnivara',
      loginUrl: verifyUrl,
    });

    return { message: 'Verification email sent' };
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerifyToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    await this.prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
    await this.prisma.emailVerifyToken.delete({ where: { id: record.id } });
    return { message: 'Email verified successfully' };
  }

  /* ── Update current user (PATCH /auth/me) ────────────────────────────── */

  async updateMe(userId: string, data: { name?: string; jobTitle?: string; phone?: string; timezone?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
      },
    });
    const { passwordHash: _, ...safe } = user as typeof user & { passwordHash?: string };
    return safe;
  }

  /* ── Change password (PATCH /auth/me/password) ──────────────────────── */

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash) throw new UnauthorizedException('Account uses SSO — password change not allowed');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    // Revoke all refresh tokens to force re-login on other devices
    await this.prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
    return { message: 'Password changed successfully' };
  }

  /* ── Upload avatar (POST /auth/me/avatar) ────────────────────────────── */

  async updateAvatar(userId: string, buffer: Buffer, mimetype: string, originalName: string) {
    const url = await this.storage.uploadFile('avatars', buffer, mimetype, originalName);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
      select: { id: true, email: true, name: true, avatarUrl: true, emailVerified: true },
    });
    return user;
  }
}
