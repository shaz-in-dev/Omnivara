import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:omnivara_mobile/core/auth/auth_provider.dart';
import 'package:omnivara_mobile/core/network/api_client.dart';

// ── Model ─────────────────────────────────────────────────────────────────────

class Invoice {
  const Invoice({
    required this.id,
    required this.number,
    required this.status,
    required this.total,
    required this.currency,
    required this.createdAt,
    this.clientName,
    this.dueDate,
    this.paidAt,
  });

  final String id;
  final String number;
  final String status;
  final double total;
  final String currency;
  final DateTime createdAt;
  final String? clientName;
  final DateTime? dueDate;
  final DateTime? paidAt;

  factory Invoice.fromJson(Map<String, dynamic> json) => Invoice(
        id:         json['id'] as String,
        number:     json['number'] as String,
        status:     json['status'] as String? ?? 'draft',
        total:      (json['total'] as num?)?.toDouble() ?? 0,
        currency:   json['currency'] as String? ?? 'USD',
        createdAt:  DateTime.parse(json['createdAt'] as String),
        clientName: json['clientName'] as String? ??
            (json['account'] as Map<String, dynamic>?)?['name'] as String?,
        dueDate: json['dueDate'] != null ? DateTime.tryParse(json['dueDate'] as String) : null,
        paidAt:  json['paidAt']  != null ? DateTime.tryParse(json['paidAt']  as String) : null,
      );

  Color get statusColor => switch (status) {
    'paid'     => const Color(0xFF10B981),
    'sent'     => const Color(0xFF3B82F6),
    'overdue'  => const Color(0xFFEF4444),
    'partial'  => const Color(0xFFF59E0B),
    'draft'    => const Color(0xFF94A3B8),
    'cancelled' || 'refunded' => const Color(0xFF6B7280),
    _          => const Color(0xFF94A3B8),
  };

  bool get isOverdue =>
      status != 'paid' && status != 'cancelled' &&
      dueDate != null && dueDate!.isBefore(DateTime.now());
}

// ── Provider ──────────────────────────────────────────────────────────────────

final invoicesProvider = FutureProvider.autoDispose<List<Invoice>>((ref) async {
  final orgId = ref.watch(currentOrgIdProvider);
  if (orgId == null || orgId.isEmpty) return [];
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/finance/invoices', queryParameters: {'limit': 40},
      options: dio.options.copyWith(headers: {'x-org-id': orgId}));
  final payload = res.data['data'] ?? res.data;
  final list = payload is List ? payload : (payload['items'] ?? []) as List<dynamic>;
  return list.map((e) => Invoice.fromJson(e as Map<String, dynamic>)).toList();
});

// ── Screen ────────────────────────────────────────────────────────────────────

class InvoicesScreen extends ConsumerStatefulWidget {
  const InvoicesScreen({super.key});

  @override
  ConsumerState<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends ConsumerState<InvoicesScreen> {
  String _filter = 'all';
  static const _filters = ['all', 'draft', 'sent', 'paid', 'overdue'];

  static final _curr = NumberFormat.currency(symbol: '\$', decimalDigits: 2);

  @override
  Widget build(BuildContext context) {
    final invoicesAsync = ref.watch(invoicesProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Invoices'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(invoicesProvider),
          ),
        ],
      ),
      body: Column(
        children: [
          // Summary stats
          invoicesAsync.when(
            data: (invoices) {
              final total    = invoices.fold<double>(0, (s, i) => s + i.total);
              final paid     = invoices.where((i) => i.status == 'paid').fold<double>(0, (s, i) => s + i.total);
              final overdue  = invoices.where((i) => i.isOverdue).fold<double>(0, (s, i) => s + i.total);
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: cs.surfaceContainerLow,
                child: Row(children: [
                  _SummaryChip(label: 'Total', value: _curr.format(total), color: cs.primary),
                  const SizedBox(width: 8),
                  _SummaryChip(label: 'Paid', value: _curr.format(paid), color: const Color(0xFF10B981)),
                  const SizedBox(width: 8),
                  if (overdue > 0)
                    _SummaryChip(label: 'Overdue', value: _curr.format(overdue), color: const Color(0xFFEF4444)),
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
            child: invoicesAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 8),
                  const Text('Failed to load invoices'),
                  TextButton(onPressed: () => ref.refresh(invoicesProvider), child: const Text('Retry')),
                ]),
              ),
              data: (invoices) {
                final filtered = invoices.where((inv) {
                  if (_filter == 'all') return true;
                  if (_filter == 'overdue') return inv.isOverdue;
                  return inv.status == _filter;
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.receipt_long_outlined, size: 56, color: cs.outline),
                      const SizedBox(height: 8),
                      const Text('No invoices found'),
                    ]),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.refresh(invoicesProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _InvoiceCard(invoice: filtered[i]),
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

// ── Invoice card ──────────────────────────────────────────────────────────────

class _InvoiceCard extends StatelessWidget {
  const _InvoiceCard({required this.invoice});
  final Invoice invoice;

  static final _curr = NumberFormat.currency(symbol: '\$', decimalDigits: 2);
  static final _date = DateFormat('MMM d, yyyy');

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = invoice.statusColor;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: theme.colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(
              child: Text(
                invoice.number,
                style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                invoice.isOverdue ? 'OVERDUE' : invoice.status.toUpperCase(),
                style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w700),
              ),
            ),
          ]),
          if (invoice.clientName != null) ...[
            const SizedBox(height: 4),
            Text(invoice.clientName!, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          ],
          const SizedBox(height: 10),
          Row(children: [
            Text(
              _curr.format(invoice.total),
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const Spacer(),
            if (invoice.dueDate != null)
              Text(
                'Due ${_date.format(invoice.dueDate!)}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: invoice.isOverdue ? Colors.red : theme.colorScheme.onSurfaceVariant,
                  fontWeight: invoice.isOverdue ? FontWeight.w600 : null,
                ),
              ),
          ]),
        ]),
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip({required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
          Text(value, style: TextStyle(fontSize: 13, color: color, fontWeight: FontWeight.bold)),
        ],
      );
}
