import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface OrgHealthScore {
  orgId:      string;
  orgName:    string;
  score:      number;
  tier:       'green' | 'yellow' | 'red';
  breakdown: {
    logins:      number; // 0–30
    recordsCreated: number; // 0–20
    modulesUsed:  number; // 0–20
    aiUsage:     number; // 0–15
    teamActivity: number; // 0–15
  };
  lastActiveAt: Date | null;
  memberCount:  number;
}

@Injectable()
export class HealthScoreService {
  private readonly logger = new Logger(HealthScoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrgHealthScore(orgId: string): Promise<OrgHealthScore> {
    const now    = new Date();
    const ago14  = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const ago30  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [org, auditLogs, recentRecords, members] = await Promise.all([
      this.prisma.organization.findUnique({
        where:  { id: orgId },
        select: { id: true, name: true },
      }),
      // Count logins (action = 'POST /auth/login') in last 14 days
      this.prisma.auditLog.count({
        where: {
          orgId,
          action:    { contains: 'login', mode: 'insensitive' },
          createdAt: { gte: ago14 },
        },
      }),
      // Count records created in last 30 days (any non-GET action)
      this.prisma.auditLog.count({
        where: {
          orgId,
          action:    { startsWith: 'POST' },
          createdAt: { gte: ago30 },
        },
      }),
      // Active members
      this.prisma.organizationMember.findMany({
        where:  { orgId },
        select: { userId: true },
      }),
    ]);

    // Modules used — check distinct resourceTypes in audit logs last 30 days
    const usedModules = await this.prisma.auditLog.findMany({
      where:    { orgId, createdAt: { gte: ago30 } },
      select:   { resourceType: true },
      distinct: ['resourceType'],
    });
    const moduleCount = usedModules.filter((m) => m.resourceType).length;

    // AI usage — count copilot calls
    const aiUsage = await this.prisma.auditLog.count({
      where: {
        orgId,
        resourceType: { contains: 'ai', mode: 'insensitive' },
        createdAt:    { gte: ago30 },
      },
    });

    // Last active
    const lastLog = await this.prisma.auditLog.findFirst({
      where:   { orgId },
      orderBy: { createdAt: 'desc' },
      select:  { createdAt: true },
    });

    // ── Score calculation ────────────────────────────────────────────────────
    const loginScore    = Math.min(30, auditLogs * 2);           // 15+ logins = full score
    const recordScore   = Math.min(20, recentRecords * 2);       // 10+ records = full score
    const moduleScore   = Math.min(20, moduleCount * 4);         // 5 modules = full score
    const aiScore       = Math.min(15, aiUsage * 3);             // 5+ AI calls = full score
    const teamScore     = Math.min(15, (members.length - 1) * 5); // 3+ active members = full score

    const score = Math.round(Math.max(0, loginScore + recordScore + moduleScore + aiScore + teamScore));
    const tier  = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red';

    return {
      orgId,
      orgName:      org?.name ?? orgId,
      score,
      tier,
      breakdown:    { logins: loginScore, recordsCreated: recordScore, modulesUsed: moduleScore, aiUsage: aiScore, teamActivity: teamScore },
      lastActiveAt: lastLog?.createdAt ?? null,
      memberCount:  members.length,
    };
  }

  async getAllOrgHealthScores(): Promise<OrgHealthScore[]> {
    const orgs = await this.prisma.organization.findMany({
      select: { id: true },
      take:   200,
    });

    const scores = await Promise.allSettled(
      orgs.map((o) => this.getOrgHealthScore(o.id)),
    );

    return scores
      .filter((r): r is PromiseFulfilledResult<OrgHealthScore> => r.status === 'fulfilled')
      .map((r) => r.value)
      .sort((a, b) => a.score - b.score); // at-risk first
  }

  async getAtRiskOrgs(threshold = 40): Promise<OrgHealthScore[]> {
    const all = await this.getAllOrgHealthScores();
    return all.filter((o) => o.score < threshold);
  }
}
