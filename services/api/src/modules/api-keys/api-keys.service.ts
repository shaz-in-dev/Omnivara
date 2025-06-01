import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

const PREFIX_LENGTH = 8; // "omni_" + 3 random chars

/**
 * Generates, stores, and revokes API keys.
 *
 * The full key (omni_<random>) is shown ONCE at creation.
 * Only the SHA-256 hash is persisted — we can never retrieve the raw key.
 */
@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a new API key for the org. Returns full key only once. */
  async create(
    orgId: string,
    createdBy: string,
    name: string,
    expiresAt?: Date,
  ): Promise<{ key: string; id: string; prefix: string; name: string; createdAt: Date; expiresAt: Date | null }> {
    // Generate: "omni_" + 40 hex chars = 45-char key
    const rawRandom = crypto.randomBytes(20).toString('hex');
    const rawKey = `omni_${rawRandom}`;

    // First PREFIX_LENGTH chars from after "omni_" as the visible prefix
    const prefix = rawKey.slice(0, PREFIX_LENGTH);

    // SHA-256 of the full key
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const record = await this.prisma.apiKey.create({
      data: { orgId, name, keyHash, prefix, createdBy, expiresAt: expiresAt ?? null },
      select: { id: true, prefix: true, name: true, createdAt: true, expiresAt: true },
    });

    return { key: rawKey, ...record };
  }

  /** List all (non-expired) API keys for an org — never returns keyHash */
  async findAll(orgId: string) {
    return this.prisma.apiKey.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, prefix: true,
        lastUsed: true, expiresAt: true, createdAt: true,
        createdBy: true,
      },
    });
  }

  /** Revoke (delete) a single API key */
  async revoke(orgId: string, id: string): Promise<void> {
    const key = await this.prisma.apiKey.findFirst({ where: { id, orgId } });
    if (!key) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.delete({ where: { id } });
  }

  /** Authenticate an incoming API key — updates lastUsed, returns orgId */
  async authenticate(rawKey: string): Promise<{ orgId: string; id: string } | null> {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const record = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      select: { id: true, orgId: true, expiresAt: true },
    });

    if (!record) return null;
    if (record.expiresAt && record.expiresAt < new Date()) return null;

    // Update lastUsed async (fire-and-forget)
    void this.prisma.apiKey.update({
      where: { id: record.id },
      data:  { lastUsed: new Date() },
    });

    return { orgId: record.orgId, id: record.id };
  }
}
