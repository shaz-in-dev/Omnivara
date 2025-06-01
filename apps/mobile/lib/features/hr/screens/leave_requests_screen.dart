import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:omnivara_mobile/core/auth/auth_provider.dart';
import 'package:omnivara_mobile/core/network/api_client.dart';

// ── Model ─────────────────────────────────────────────────────────────────────

class LeaveRequest {
  const LeaveRequest({
    required this.id,
    required this.type,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.days,
    this.employeeName,
    this.reason,
  });

  final String id;
  final String type;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
  final int days;
  final String? employeeName;
  final String? reason;

  factory LeaveRequest.fromJson(Map<String, dynamic> json) {
    final emp = json['employee'] as Map<String, dynamic>?;
    final empName = emp != null ? '${emp['firstName'] ?? ''} ${emp['lastName'] ?? ''}'.trim() : null;
    return LeaveRequest(
      id:           json['id'] as String,
      type:         json['type'] as String? ?? 'annual',
      status:       json['status'] as String? ?? 'pending',
      startDate:    DateTime.parse(json['startDate'] as String),
      endDate:      DateTime.parse(json['endDate'] as String),
      days:         json['days'] as int? ?? 1,
      employeeName: empName?.isNotEmpty == true ? empName : null,
      reason:       json['reason'] as String?,
    );
  }

  Color get statusColor => switch (status) {
    'approved'  => const Color(0xFF10B981),
    'denied'    => const Color(0xFFEF4444),
    'cancelled' => const Color(0xFF6B7280),
    _           => const Color(0xFFF59E0B),
  };

  IconData get typeIcon => switch (type.toLowerCase()) {
    'annual'    || 'vacation' => Icons.beach_access_outlined,
    'sick'                    => Icons.local_hospital_outlined,
    'maternity' || 'paternity' => Icons.child_care_outlined,
    'unpaid'                  => Icons.money_off_outlined,
    _                         => Icons.event_outlined,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

final leaveRequestsProvider = FutureProvider.autoDispose<List<LeaveRequest>>((ref) async {
  final orgId = ref.watch(currentOrgIdProvider);
  if (orgId == null || orgId.isEmpty) return [];
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/orgs/$orgId/hr/leave-requests', queryParameters: {'limit': 40});
  final payload = res.data['data'] ?? res.data;
  final list = payload is List ? payload : (payload['items'] ?? []) as List<dynamic>;
  return list.map((e) => LeaveRequest.fromJson(e as Map<String, dynamic>)).toList();
});

// ── Screen ────────────────────────────────────────────────────────────────────

class LeaveRequestsScreen extends ConsumerStatefulWidget {
  const LeaveRequestsScreen({super.key});

  @override
  ConsumerState<LeaveRequestsScreen> createState() => _LeaveRequestsScreenState();
}

class _LeaveRequestsScreenState extends ConsumerState<LeaveRequestsScreen> {
  String _filter = 'all';
  static const _filters = ['all', 'pending', 'approved', 'denied'];
  static final _date = DateFormat('MMM d');

  @override
  Widget build(BuildContext context) {
    final requestsAsync = ref.watch(leaveRequestsProvider);
    final cs = Theme.of(context).colorScheme;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Leave Requests'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: () => ref.refresh(leaveRequestsProvider)),
        ],
      ),
      body: Column(
        children: [
          // Stats
          requestsAsync.when(
            data: (requests) {
              final pending  = requests.where((r) => r.status == 'pending').length;
              final approved = requests.where((r) => r.status == 'approved').length;
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: cs.surfaceContainerLow,
                child: Row(children: [
                  _Stat('${requests.length}', 'Total', cs.onSurface),
                  const SizedBox(width: 20),
                  _Stat('$pending', 'Pending', const Color(0xFFF59E0B)),
                  const SizedBox(width: 20),
                  _Stat('$approved', 'Approved', const Color(0xFF10B981)),
                ]),
              );
            },
            loading: () => const SizedBox(height: 48),
            error: (_, __) => const SizedBox.shrink(),
          ),

          // Filter chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              scrollDirection: Axis.horizontal,
              itemCount: _filters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final f = _filters[i];
                return FilterChip(
                  label: Text(f[0].toUpperCase() + f.substring(1)),
                  selected: _filter == f,
                  onSelected: (_) => setState(() => _filter = f),
                );
              },
            ),
          ),

          // List
          Expanded(
            child: requestsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 8),
                  const Text('Failed to load leave requests'),
                  TextButton(onPressed: () => ref.refresh(leaveRequestsProvider), child: const Text('Retry')),
                ]),
              ),
              data: (requests) {
                final filtered = requests
                    .where((r) => _filter == 'all' || r.status == _filter)
                    .toList();

                if (filtered.isEmpty) {
                  return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.event_available_outlined, size: 56, color: cs.outline),
                    const SizedBox(height: 8),
                    const Text('No leave requests'),
                  ]));
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.refresh(leaveRequestsProvider),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    itemBuilder: (_, i) {
                      final req = filtered[i];
                      final color = req.statusColor;
                      return Card(
                        elevation: 0,
                        margin: const EdgeInsets.only(bottom: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                          side: BorderSide(color: cs.outlineVariant),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Row(children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: color.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(req.typeIcon, size: 16, color: color),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  if (req.employeeName != null)
                                    Text(req.employeeName!, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                                  Text(req.type.toUpperCase(), style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                                ]),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                                child: Text(req.status, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w700)),
                              ),
                            ]),
                            const SizedBox(height: 10),
                            Row(children: [
                              Icon(Icons.calendar_today_outlined, size: 13, color: cs.onSurfaceVariant),
                              const SizedBox(width: 4),
                              Text(
                                '${_date.format(req.startDate)} – ${_date.format(req.endDate)}',
                                style: theme.textTheme.bodySmall,
                              ),
                              const SizedBox(width: 12),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                decoration: BoxDecoration(color: cs.surfaceContainerHighest, borderRadius: BorderRadius.circular(8)),
                                child: Text('${req.days}d', style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
                              ),
                            ]),
                            if (req.reason != null && req.reason!.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(req.reason!, style: theme.textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant), maxLines: 2, overflow: TextOverflow.ellipsis),
                            ],
                          ]),
                        ),
                      );
                    },
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

class _Stat extends StatelessWidget {
  const _Stat(this.value, this.label, this.color);
  final String value, label;
  final Color color;
  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(label, style: TextStyle(fontSize: 11, color: color)),
    Text(value, style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: color)),
  ]);
}
