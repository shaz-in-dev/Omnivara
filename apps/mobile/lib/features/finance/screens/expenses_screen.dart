import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:omnivara_mobile/core/auth/auth_provider.dart';
import 'package:omnivara_mobile/core/network/api_client.dart';

// ── Model ─────────────────────────────────────────────────────────────────────

class Expense {
  const Expense({
    required this.id,
    required this.description,
    required this.amount,
    required this.currency,
    required this.category,
    required this.status,
    required this.date,
    this.submittedByName,
    this.receiptUrl,
  });

  final String id;
  final String description;
  final double amount;
  final String currency;
  final String category;
  final String status;
  final DateTime date;
  final String? submittedByName;
  final String? receiptUrl;

  factory Expense.fromJson(Map<String, dynamic> json) => Expense(
        id:              json['id'] as String,
        description:     json['description'] as String,
        amount:          (json['amount'] as num?)?.toDouble() ?? 0,
        currency:        json['currency'] as String? ?? 'USD',
        category:        json['category'] as String? ?? 'other',
        status:          json['status'] as String? ?? 'pending',
        date:            DateTime.parse(json['date'] as String? ?? json['createdAt'] as String),
        submittedByName: (json['submittedBy'] as Map<String, dynamic>?)?['name'] as String?,
        receiptUrl:      json['receiptUrl'] as String?,
      );

  Color get statusColor => switch (status) {
    'approved'  => const Color(0xFF10B981),
    'rejected'  => const Color(0xFFEF4444),
    'reimbursed' => const Color(0xFF6366F1),
    _           => const Color(0xFFF59E0B),
  };

  IconData get categoryIcon => switch (category.toLowerCase()) {
    'travel'       => Icons.flight_outlined,
    'meals'        => Icons.restaurant_outlined,
    'software'     => Icons.computer_outlined,
    'office'       => Icons.business_center_outlined,
    'marketing'    => Icons.campaign_outlined,
    _              => Icons.receipt_outlined,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

final expensesProvider = FutureProvider.autoDispose<List<Expense>>((ref) async {
  final orgId = ref.watch(currentOrgIdProvider);
  if (orgId == null || orgId.isEmpty) return [];
  final dio = ref.watch(dioProvider);
  final res = await dio.get(
    '/finance/expenses',
    queryParameters: {'limit': 40},
    options: dio.options.copyWith(headers: {'x-org-id': orgId}),
  );
  final payload = res.data['data'] ?? res.data;
  final list = payload is List ? payload : (payload['items'] ?? []) as List<dynamic>;
  return list.map((e) => Expense.fromJson(e as Map<String, dynamic>)).toList();
});

// ── Screen ────────────────────────────────────────────────────────────────────

class ExpensesScreen extends ConsumerStatefulWidget {
  const ExpensesScreen({super.key});

  @override
  ConsumerState<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends ConsumerState<ExpensesScreen> {
  String _filter = 'all';
  static const _filters = ['all', 'pending', 'approved', 'rejected'];

  static final _curr = NumberFormat.currency(symbol: '\$', decimalDigits: 2);
  static final _date = DateFormat('MMM d');

  @override
  Widget build(BuildContext context) {
    final expensesAsync = ref.watch(expensesProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Expenses'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(expensesProvider),
          ),
        ],
      ),
      body: Column(
        children: [
          // Summary bar
          expensesAsync.when(
            data: (expenses) {
              final total    = expenses.fold<double>(0, (s, e) => s + e.amount);
              final pending  = expenses.where((e) => e.status == 'pending').fold<double>(0, (s, e) => s + e.amount);
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: cs.surfaceContainerLow,
                child: Row(children: [
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Total', style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                    Text(_curr.format(total), style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: cs.onSurface)),
                  ]),
                  const SizedBox(width: 20),
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Pending', style: const TextStyle(fontSize: 11, color: Color(0xFFF59E0B))),
                    Text(_curr.format(pending), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFF59E0B))),
                  ]),
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
            child: expensesAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 8),
                  const Text('Failed to load expenses'),
                  TextButton(onPressed: () => ref.refresh(expensesProvider), child: const Text('Retry')),
                ]),
              ),
              data: (expenses) {
                final filtered = expenses
                    .where((e) => _filter == 'all' || e.status == _filter)
                    .toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.credit_card_outlined, size: 56, color: cs.outline),
                      const SizedBox(height: 8),
                      const Text('No expenses found'),
                    ]),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.refresh(expensesProvider),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    itemBuilder: (_, i) {
                      final exp = filtered[i];
                      final color = exp.statusColor;
                      return Card(
                        elevation: 0,
                        margin: const EdgeInsets.only(bottom: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: cs.outlineVariant),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          leading: Container(
                            width: 40, height: 40,
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(exp.categoryIcon, size: 18, color: color),
                          ),
                          title: Text(exp.description, style: const TextStyle(fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                          subtitle: Text(
                            [exp.category, if (exp.submittedByName != null) exp.submittedByName!].join(' · '),
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(_curr.format(exp.amount), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              const SizedBox(height: 2),
                              Row(mainAxisSize: MainAxisSize.min, children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                  decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                                  child: Text(exp.status, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
                                ),
                                const SizedBox(width: 6),
                                Text(_date.format(exp.date), style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                              ]),
                            ],
                          ),
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
