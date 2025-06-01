import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns a user profile only when the requester shares at least one org
   * with the target user. Prevents cross-tenant profile enumeration.
   */
  async findById(id: string, requestingUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, avatarUrl: true, emailVerified: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Verify requester and target share an org
    const sharedOrg = await this.prisma.organizationMember.findFirst({
      where: {
        userId: id,
        org: { users: { some: { userId: requestingUserId } } },
      },
      select: { id: true },
    });
    if (!sharedOrg) throw new ForbiddenException('Access denied');

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
