import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:omnivara_mobile/core/auth/auth_provider.dart';
import 'package:omnivara_mobile/core/network/api_client.dart';

// ── Model ─────────────────────────────────────────────────────────────────────

class Employee {
  const Employee({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.jobTitle,
    required this.department,
    required this.status,
    this.email,
    this.phone,
    this.location,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String jobTitle;
  final String department;
  final String status;
  final String? email;
  final String? phone;
  final String? location;

  String get fullName => '$firstName $lastName'.trim();
  String get initials => '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'.toUpperCase();

  factory Employee.fromJson(Map<String, dynamic> json) => Employee(
        id:         json['id'] as String,
        firstName:  json['firstName'] as String? ?? '',
        lastName:   json['lastName']  as String? ?? '',
        jobTitle:   json['jobTitle']  as String? ?? '',
        department: json['department'] as String? ?? '',
        status:     json['status'] as String? ?? 'active',
        email:      json['email'] as String?,
        phone:      json['phone'] as String?,
        location:   json['location'] as String?,
      );

  Color get statusColor => switch (status) {
    'active'       => const Color(0xFF10B981),
    'on_leave'     => const Color(0xFFF59E0B),
    'offboarding'  => const Color(0xFFEF4444),
    'terminated'   => const Color(0xFF6B7280),
    _              => const Color(0xFF94A3B8),
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

final employeesProvider = FutureProvider.autoDispose<List<Employee>>((ref) async {
  final orgId = ref.watch(currentOrgIdProvider);
  if (orgId == null || orgId.isEmpty) return [];
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/orgs/$orgId/hr/employees', queryParameters: {'limit': 50});
  final payload = res.data['data'] ?? res.data;
  final list = payload is List ? payload : (payload['items'] ?? []) as List<dynamic>;
  return list.map((e) => Employee.fromJson(e as Map<String, dynamic>)).toList();
});

// ── Screen ────────────────────────────────────────────────────────────────────

class EmployeesScreen extends ConsumerStatefulWidget {
  const EmployeesScreen({super.key});

  @override
  ConsumerState<EmployeesScreen> createState() => _EmployeesScreenState();
}

class _EmployeesScreenState extends ConsumerState<EmployeesScreen> {
  final _searchCtrl = TextEditingController();
  String _dept = 'All';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final employeesAsync = ref.watch(employeesProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Employees'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: () => ref.refresh(employeesProvider)),
        ],
      ),
      body: Column(
        children: [
          // Search
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search employees…',
                prefixIcon: const Icon(Icons.search, size: 20),
                filled: true,
                fillColor: cs.surfaceContainerHighest,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: EdgeInsets.zero,
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),

          // Department filter from data
          employeesAsync.when(
            data: (employees) {
              final depts = ['All', ...{...employees.map((e) => e.department)}.toList()..sort()];
              return SizedBox(
                height: 44,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  scrollDirection: Axis.horizontal,
                  itemCount: depts.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) => FilterChip(
                    label: Text(depts[i]),
                    selected: _dept == depts[i],
                    onSelected: (_) => setState(() => _dept = depts[i]),
                    visualDensity: VisualDensity.compact,
                  ),
                ),
              );
            },
            loading: () => const SizedBox(height: 44),
            error: (_, __) => const SizedBox.shrink(),
          ),
          const SizedBox(height: 4),

          // List
          Expanded(
            child: employeesAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 8),
                  const Text('Failed to load employees'),
                  TextButton(onPressed: () => ref.refresh(employeesProvider), child: const Text('Retry')),
                ]),
              ),
              data: (employees) {
                final q = _searchCtrl.text.toLowerCase();
                final filtered = employees.where((e) {
                  final matchDept = _dept == 'All' || e.department == _dept;
                  final matchSearch = q.isEmpty ||
                      e.fullName.toLowerCase().contains(q) ||
                      e.jobTitle.toLowerCase().contains(q) ||
                      (e.email?.toLowerCase().contains(q) ?? false);
                  return matchDept && matchSearch;
                }).toList();

                if (filtered.isEmpty) {
                  return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.people_outline, size: 56, color: cs.outline),
                    const SizedBox(height: 8),
                    const Text('No employees found'),
                  ]));
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.refresh(employeesProvider),
                  child: ListView.builder(
                    itemCount: filtered.length,
                    itemBuilder: (_, i) {
                      final emp = filtered[i];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: const Color(0xFF6366F1).withOpacity(0.15),
                          child: Text(emp.initials, style: const TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.bold, fontSize: 13)),
                        ),
                        title: Text(emp.fullName, style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text('${emp.jobTitle} · ${emp.department}'),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: emp.statusColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(emp.status.replaceAll('_', ' '), style: TextStyle(fontSize: 11, color: emp.statusColor, fontWeight: FontWeight.w600)),
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
