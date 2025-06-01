import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

export type NotificationType =
  | 'task_assigned' | 'task_comment' | 'mention'
  | 'ticket_update' | 'invoice_status' | 'lead_status'
  | 'leave_approved' | 'stock_low' | 'system';

export interface NotificationEvent {
  id:        string;
  orgId:     string;
  userId?:   string;
  type:      NotificationType;
  title:     string;
  body:      string;
  url?:      string;
  createdAt: string;
  read:      boolean;
  readAt?:   string | null;
}

/** Used internally by the WebSocket gateway */
export interface NotificationPayload extends NotificationEvent {}

// Keep an in-memory RxJS Subject for SSE push — complementary to DB persistence
const MAX_RECENT = 50;
const CLEANUP_DAYS = 90; // auto-delete notifications older than this

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  /** In-process SSE/WS broadcast channel */
  private readonly subject = new Subject<NotificationEvent>();

  constructor(private readonly prisma: PrismaService) {}

  // ── Write ─────────────────────────────────────────────────────────────────

  /** Persist + broadcast a notification. Returns the stored record. */
  async emit(event: Omit<NotificationEvent, 'id' | 'createdAt' | 'read' | 'readAt'>): Promise<NotificationEvent> {
    let stored: NotificationEvent;
    try {
      const row = await this.prisma.notification.create({
        data: {
          orgId:  event.orgId,
          userId: event.userId ?? null,
          type:   event.type,
          title:  event.title,
          body:   event.body,
          url:    event.url ?? null,
        },
      });
      stored = {
        id:        row.id,
        orgId:     row.orgId,
        userId:    row.userId ?? undefined,
        type:      row.type as NotificationType,
        title:     row.title,
        body:      row.body,
        url:       row.url ?? undefined,
        createdAt: row.createdAt.toISOString(),
        read:      row.read,
        readAt:    row.readAt?.toISOString() ?? null,
      };
    } catch (err: unknown) {
      // Fallback: create an ephemeral event if DB is unavailable
      this.logger.warn(`Notification persist failed: ${(err as Error).message}`);
      stored = {
        ...event,
        id:        `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        read:      false,
        readAt:    null,
      };
    }

    // Broadcast to SSE subscribers
    this.subject.next(stored);
    return stored;
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  /** Paginated list visible to a user (their own + broadcasts). */
  async getRecent(orgId: string, userId: string, limit = MAX_RECENT) {
    const rows = await this.prisma.notification.findMany({
      where: {
        orgId,
        OR: [
          { userId },
          { userId: null }, // broadcasts
        ],
      },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    });

    return rows.map((r) => ({
      id:        r.id,
      orgId:     r.orgId,
      userId:    r.userId ?? undefined,
      type:      r.type as NotificationType,
      title:     r.title,
      body:      r.body,
      url:       r.url ?? undefined,
      createdAt: r.createdAt.toISOString(),
      read:      r.read,
      readAt:    r.readAt?.toISOString() ?? null,
    }));
  }

  /** Count unread notifications for a user. */
  async unreadCount(orgId: string, userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        orgId,
        read: false,
        OR:   [{ userId }, { userId: null }],
      },
    });
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  async markRead(orgId: string, userId: string, id: string): Promise<void> {
    const n = await this.prisma.notification.findFirst({
      where: { id, orgId, OR: [{ userId }, { userId: null }] },
    });
    if (!n) throw new NotFoundException('Notification not found');
    if (!n.read) {
      await this.prisma.notification.update({
        where: { id },
        data:  { read: true, readAt: new Date() },
      });
    }
  }

  async markAllRead(orgId: string, userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        orgId,
        read: false,
        OR:   [{ userId }, { userId: null }],
      },
      data: { read: true, readAt: new Date() },
    });
    return { count: result.count };
  }

  async deleteNotification(orgId: string, userId: string, id: string): Promise<void> {
    const n = await this.prisma.notification.findFirst({
      where: { id, orgId, OR: [{ userId }, { userId: null }] },
    });
    if (!n) throw new NotFoundException('Notification not found');
    await this.prisma.notification.delete({ where: { id } });
  }

  // ── SSE stream ────────────────────────────────────────────────────────────

  /** Returns an Observable<MessageEvent> for SSE — filters to this user's events. */
  getStream(orgId: string, userId: string): Observable<MessageEvent> {
    return this.subject.asObservable().pipe(
      filter((e) =>
        e.orgId === orgId &&
        (!e.userId || e.userId === userId),
      ),
      map((e) => ({ data: e }) as MessageEvent),
    );
  }

  // ── Maintenance ───────────────────────────────────────────────────────────

  /** Delete notifications older than CLEANUP_DAYS. Called by scheduler. */
  async cleanup(): Promise<number> {
    const cutoff = new Date(Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000);
    const { count } = await this.prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (count > 0) this.logger.log(`Cleaned up ${count} old notifications`);
    return count;
  }
}
