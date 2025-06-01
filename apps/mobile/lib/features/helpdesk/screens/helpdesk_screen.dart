import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:omnivara_mobile/core/auth/auth_provider.dart';
import 'package:omnivara_mobile/core/network/api_client.dart';

// ── Data model ────────────────────────────────────────────────────────────────

class Ticket {
  const Ticket({
    required this.id,
    required this.subject,
    required this.status,
    required this.priority,
    required this.channel,
    required this.createdAt,
    this.assigneeName,
  });

  final String id;
  final String subject;
  final String status;
  final String priority;
  final String channel;
  final DateTime createdAt;
  final String? assigneeName;

  factory Ticket.fromJson(Map<String, dynamic> json) => Ticket(
        id:           json['id'] as String,
        subject:      json['subject'] as String,
        status:       json['status'] as String? ?? 'open',
        priority:     json['priority'] as String? ?? 'medium',
        channel:      json['channel'] as String? ?? 'email',
        createdAt:    DateTime.parse(json['createdAt'] as String),
        assigneeName: (json['assignee'] as Map<String, dynamic>?)?['name'] as String?,
      );

  Color get priorityColor => switch (priority) {
    'urgent' => Colors.red,
    'high'   => Colors.orange,
    'medium' => Colors.blue,
    _        => Colors.grey,
  };

  IconData get statusIcon => switch (status) {
    'resolved' || 'closed' => Icons.check_circle_outline,
    'pending'  => Icons.pause_circle_outline,
    'on_hold'  => Icons.access_time,
    _          => Icons.radio_button_unchecked,
  };
}

// ── Providers ─────────────────────────────────────────────────────────────────

final ticketsProvider = FutureProvider.autoDispose<List<Ticket>>((ref) async {
  final orgId = ref.watch(currentOrgIdProvider);
  if (orgId == null || orgId.isEmpty) return [];
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/orgs/$orgId/helpdesk/tickets', queryParameters: {'limit': 50});
  final list = (res.data['data'] ?? res.data) as List<dynamic>;
  return list.map((e) => Ticket.fromJson(e as Map<String, dynamic>)).toList();
});

// ── Screen ─────────────────────────────────────────────────────────────────────

class HelpdeskScreen extends ConsumerStatefulWidget {
  const HelpdeskScreen({super.key});

  @override
  ConsumerState<HelpdeskScreen> createState() => _HelpdeskScreenState();
}

class _HelpdeskScreenState extends ConsumerState<HelpdeskScreen> {
  String _statusFilter = 'all';
  static const _statusFilters = ['all', 'open', 'pending', 'resolved'];

  @override
  Widget build(BuildContext context) {
    final ticketsAsync = ref.watch(ticketsProvider);
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Helpdesk'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(ticketsProvider),
          ),
        ],
      ),
      body: Column(
        children: [
          // Stats summary bar
          ticketsAsync.when(
            data: (tickets) {
              final open = tickets.where((t) => t.status == 'open').length;
              final urgent = tickets.where((t) => t.priority == 'urgent').length;
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: cs.surfaceContainerLow,
                child: Row(
                  children: [
                    _StatChip(label: '$open open', color: Colors.blue),
                    const SizedBox(width: 8),
                    _StatChip(label: '$urgent urgent', color: Colors.red),
                    const SizedBox(width: 8),
                    _StatChip(label: '${tickets.length} total', color: cs.outline),
                  ],
                ),
              );
            },
            loading: () => const SizedBox(height: 48),
            error: (_, __) => const SizedBox.shrink(),
          ),

          // Status filter chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              scrollDirection: Axis.horizontal,
              itemCount: _statusFilters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final f = _statusFilters[i];
                return FilterChip(
                  label: Text(f[0].toUpperCase() + f.substring(1)),
                  selected: _statusFilter == f,
                  onSelected: (_) => setState(() => _statusFilter = f),
                );
              },
            ),
          ),

          // Ticket list
          Expanded(
            child: ticketsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 8),
                  const Text('Failed to load tickets'),
                  TextButton(
                    onPressed: () => ref.refresh(ticketsProvider),
                    child: const Text('Retry'),
                  ),
                ]),
              ),
              data: (tickets) {
                final filtered = tickets
                    .where((t) => _statusFilter == 'all' || t.status == _statusFilter)
                    .toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.support_agent_outlined, size: 56, color: cs.outline),
                      const SizedBox(height: 8),
                      const Text('No tickets'),
                    ]),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.refresh(ticketsProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _TicketCard(ticket: filtered[i]),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ── Ticket card ──────────────────────────────────────────────────────────────

class _TicketCard extends StatelessWidget {
  const _TicketCard({required this.ticket});
  final Ticket ticket;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: theme.colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(ticket.statusIcon, size: 16, color: ticket.priorityColor),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    ticket.subject,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _Badge(ticket.priority.toUpperCase(), ticket.priorityColor),
                const SizedBox(width: 6),
                _Badge(ticket.status.toUpperCase(), Colors.grey),
                const SizedBox(width: 6),
                _Badge(ticket.channel, Colors.purple),
                const Spacer(),
                Text(
                  _relative(ticket.createdAt),
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _relative(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours   < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

class _Badge extends StatelessWidget {
  const _Badge(this.label, this.color);
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(label, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
      );
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(label, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600)),
      );
}
