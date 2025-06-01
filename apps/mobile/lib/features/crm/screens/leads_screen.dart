import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:omnivara_mobile/core/auth/auth_provider.dart';
import 'package:omnivara_mobile/core/network/api_client.dart';

// ── Data model ────────────────────────────────────────────────────────────────

class Lead {
  final String id;
  final String name;
  final String? company;
  final String status;
  final String? email;

  const Lead({
    required this.id,
    required this.name,
    this.company,
    required this.status,
    this.email,
  });

  factory Lead.fromJson(Map<String, dynamic> json) => Lead(
        id:      json['id'] as String,
        name:    json['name'] as String,
        company: json['company'] as String?,
        status:  (json['status'] as String? ?? 'new').toUpperCase(),
        email:   json['email'] as String?,
      );

  String get initials => name.isNotEmpty ? name[0].toUpperCase() : '?';
}

// ── Providers ─────────────────────────────────────────────────────────────────

final leadsProvider = FutureProvider.autoDispose<List<Lead>>((ref) async {
  final orgId = ref.watch(currentOrgIdProvider);
  if (orgId == null || orgId.isEmpty) return [];
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/orgs/$orgId/crm/leads', queryParameters: {'limit': 50});
  final list = (res.data['data'] ?? res.data) as List<dynamic>;
  return list.map((e) => Lead.fromJson(e as Map<String, dynamic>)).toList();
});

// Status chip colors
Color _statusColor(String status, ColorScheme cs) => switch (status) {
  'NEW' => cs.primaryContainer,
  'CONTACTED' => cs.secondaryContainer,
  'QUALIFIED' => cs.tertiaryContainer,
  'UNQUALIFIED' => cs.errorContainer,
  _ => cs.surfaceContainerHighest,
};

Color _statusTextColor(String status, ColorScheme cs) => switch (status) {
  'NEW' => cs.primary,
  'CONTACTED' => cs.secondary,
  'QUALIFIED' => cs.tertiary,
  'UNQUALIFIED' => cs.error,
  _ => cs.onSurfaceVariant,
};

class LeadsScreen extends ConsumerStatefulWidget {
  const LeadsScreen({super.key});

  @override
  ConsumerState<LeadsScreen> createState() => _LeadsScreenState();
}

class _LeadsScreenState extends ConsumerState<LeadsScreen> {
  final _searchCtrl = TextEditingController();
  String _selectedStatus = 'ALL';
  final _statuses = ['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED'];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final leadsAsync = ref.watch(leadsProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Leads'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(leadsProvider),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search leads…',
                prefixIcon: const Icon(Icons.search, size: 20),
                filled: true,
                fillColor: cs.surfaceContainerHighest,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: EdgeInsets.zero,
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          // Status filter chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              scrollDirection: Axis.horizontal,
              itemCount: _statuses.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final s = _statuses[i];
                return FilterChip(
                  label: Text(s),
                  selected: _selectedStatus == s,
                  onSelected: (_) => setState(() => _selectedStatus = s),
                );
              },
            ),
          ),
          // List
          Expanded(
            child: leadsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 8),
                  const Text('Failed to load leads'),
                  TextButton(
                    onPressed: () => ref.refresh(leadsProvider),
                    child: const Text('Retry'),
                  ),
                ]),
              ),
              data: (leads) {
                final q = _searchCtrl.text.toLowerCase();
                final filtered = leads.where((l) {
                  final matchStatus = _selectedStatus == 'ALL' || l.status == _selectedStatus;
                  final matchSearch = q.isEmpty ||
                      l.name.toLowerCase().contains(q) ||
                      (l.company?.toLowerCase().contains(q) ?? false) ||
                      (l.email?.toLowerCase().contains(q) ?? false);
                  return matchStatus && matchSearch;
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.person_search, size: 56, color: cs.outline),
                      const SizedBox(height: 8),
                      Text('No leads found', style: Theme.of(context).textTheme.titleMedium),
                    ]),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.refresh(leadsProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final lead = filtered[index];
                      return Card(
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: cs.primaryContainer,
                            child: Text(
                              lead.initials,
                              style: TextStyle(color: cs.primary, fontWeight: FontWeight.w600),
                            ),
                          ),
                          title: Text(lead.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text(lead.company ?? lead.email ?? ''),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: _statusColor(lead.status, cs),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              lead.status,
                              style: TextStyle(
                                color: _statusTextColor(lead.status, cs),
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
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
