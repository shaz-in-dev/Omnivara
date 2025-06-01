import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:omnivara_mobile/core/auth/auth_provider.dart';
import 'package:omnivara_mobile/core/network/api_client.dart';

// ── Stats model ───────────────────────────────────────────────────────────────

class DashboardStats {
  const DashboardStats({
    required this.openOpportunities,
    required this.pipelineValue,
    required this.openTickets,
    required this.overdueTickets,
    required this.activeProjects,
    required this.tasksDueThisWeek,
    required this.totalRevenue,
    required this.outstanding,
  });

  final int openOpportunities;
  final double pipelineValue;
  final int openTickets;
  final int overdueTickets;
  final int activeProjects;
  final int tasksDueThisWeek;
  final double totalRevenue;
  final double outstanding;

  factory DashboardStats.fromJson(Map<String, dynamic> json) => DashboardStats(
        openOpportunities: json['openOpportunities'] as int? ?? 0,
        pipelineValue:     (json['pipelineValue'] as num?)?.toDouble() ?? 0,
        openTickets:       json['openTickets'] as int? ?? 0,
        overdueTickets:    json['overdueTickets'] as int? ?? 0,
        activeProjects:    json['activeProjects'] as int? ?? 0,
        tasksDueThisWeek:  json['tasksDueThisWeek'] as int? ?? 0,
        totalRevenue:      (json['totalRevenue'] as num?)?.toDouble() ?? 0,
        outstanding:       (json['outstanding'] as num?)?.toDouble() ?? 0,
      );
}

// ── Provider ──────────────────────────────────────────────────────────────────

final dashboardStatsProvider = FutureProvider.autoDispose<DashboardStats>((ref) async {
  final orgId = ref.watch(currentOrgIdProvider);
  if (orgId == null || orgId.isEmpty) throw Exception('Not authenticated');
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/orgs/$orgId/dashboard/stats');
  return DashboardStats.fromJson(res.data as Map<String, dynamic>);
});

// ── Screen ─────────────────────────────────────────────────────────────────────

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme     = Theme.of(context);
    final user      = ref.watch(currentUserProvider);
    final statsAsync = ref.watch(dashboardStatsProvider);

    final firstName = user?.name.split(' ').first ?? 'there';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
          IconButton(
            icon: CircleAvatar(
              radius: 14,
              backgroundColor: const Color(0xFF6366F1),
              child: Text(
                firstName.isNotEmpty ? firstName[0].toUpperCase() : '?',
                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
            onPressed: () {},
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(dashboardStatsProvider),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Greeting
              Text(
                '${_greeting()}, $firstName 👋',
                style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                DateFormat('EEEE, MMM d').format(DateTime.now()),
                style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 24),

              // KPI Grid
              statsAsync.when(
                loading: () => _StatsSkeleton(),
                error: (err, _) => _StatsError(onRetry: () => ref.refresh(dashboardStatsProvider)),
                data: (stats) => _StatsGrid(stats: stats),
              ),

              const SizedBox(height: 24),

              // Quick actions
              Text('Quick Actions', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _QuickAction(icon: Icons.person_add_outlined,  label: 'New Lead',    color: const Color(0xFF6366F1))),
                  const SizedBox(width: 12),
                  Expanded(child: _QuickAction(icon: Icons.receipt_long_outlined, label: 'New Invoice', color: const Color(0xFF10B981))),
                  const SizedBox(width: 12),
                  Expanded(child: _QuickAction(icon: Icons.confirmation_num_outlined, label: 'New Ticket',  color: const Color(0xFFF59E0B))),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Stats grid ────────────────────────────────────────────────────────────────

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.stats});
  final DashboardStats stats;

  static final _curr = NumberFormat.compact(locale: 'en_US');

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.35,
      children: [
        _KpiCard(
          icon: Icons.trending_up_outlined,
          label: 'Open Deals',
          value: '${stats.openOpportunities}',
          sub: '\$${_curr.format(stats.pipelineValue)} pipeline',
          color: const Color(0xFF6366F1),
        ),
        _KpiCard(
          icon: Icons.folder_outlined,
          label: 'Active Projects',
          value: '${stats.activeProjects}',
          sub: '${stats.tasksDueThisWeek} due this week',
          color: const Color(0xFF10B981),
        ),
        _KpiCard(
          icon: Icons.headset_mic_outlined,
          label: 'Open Tickets',
          value: '${stats.openTickets}',
          sub: stats.overdueTickets > 0 ? '${stats.overdueTickets} overdue' : 'All on track',
          color: stats.overdueTickets > 0 ? const Color(0xFFEF4444) : const Color(0xFFF59E0B),
        ),
        _KpiCard(
          icon: Icons.attach_money_outlined,
          label: 'Outstanding',
          value: '\$${_curr.format(stats.outstanding)}',
          sub: '\$${_curr.format(stats.totalRevenue)} total revenue',
          color: const Color(0xFF3B82F6),
        ),
      ],
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.sub,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final String sub;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: color),
              ),
              const Spacer(),
            ]),
            const Spacer(),
            Text(value, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(label, style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
            Text(sub, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

class _StatsSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.35,
      children: List.generate(4, (_) => Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(height: 28, width: 28, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(8))),
              const Spacer(),
              Container(height: 22, width: 60, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(4))),
              const SizedBox(height: 6),
              Container(height: 12, width: 80, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(4))),
            ],
          ),
        ),
      )),
    );
  }
}

class _StatsError extends StatelessWidget {
  const _StatsError({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(children: [
        Icon(Icons.error_outline, color: Theme.of(context).colorScheme.onErrorContainer),
        const SizedBox(width: 12),
        const Expanded(child: Text('Could not load stats')),
        TextButton(onPressed: onRetry, child: const Text('Retry')),
      ]),
    );
  }
}

// ── Quick action card ─────────────────────────────────────────────────────────

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, required this.color});
  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () {},
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 6),
          Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
        ]),
      ),
    );
  }
}
