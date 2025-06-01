import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:omnivara_mobile/core/auth/auth_provider.dart';
import 'package:omnivara_mobile/core/network/api_client.dart';

// ── Model ─────────────────────────────────────────────────────────────────────

class Contact {
  const Contact({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.email,
    this.phone,
    this.jobTitle,
    this.accountName,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String? email;
  final String? phone;
  final String? jobTitle;
  final String? accountName;

  String get fullName => '$firstName $lastName'.trim();
  String get initials {
    final f = firstName.isNotEmpty ? firstName[0] : '';
    final l = lastName.isNotEmpty  ? lastName[0]  : '';
    return '$f$l'.toUpperCase();
  }

  factory Contact.fromJson(Map<String, dynamic> json) => Contact(
        id:          json['id'] as String,
        firstName:   json['firstName'] as String? ?? '',
        lastName:    json['lastName']  as String? ?? '',
        email:       json['email']     as String?,
        phone:       json['phone']     as String?,
        jobTitle:    json['jobTitle']  as String?,
        accountName: (json['account'] as Map<String, dynamic>?)?['name'] as String?,
      );
}

// ── Provider ──────────────────────────────────────────────────────────────────

final contactsProvider = FutureProvider.autoDispose<List<Contact>>((ref) async {
  final orgId = ref.watch(currentOrgIdProvider);
  if (orgId == null || orgId.isEmpty) return [];
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/orgs/$orgId/crm/contacts', queryParameters: {'limit': 50});
  final list = (res.data['data'] ?? res.data) as List<dynamic>;
  return list.map((e) => Contact.fromJson(e as Map<String, dynamic>)).toList();
});

// ── Screen ─────────────────────────────────────────────────────────────────────

class ContactsScreen extends ConsumerStatefulWidget {
  const ContactsScreen({super.key});

  @override
  ConsumerState<ContactsScreen> createState() => _ContactsScreenState();
}

class _ContactsScreenState extends ConsumerState<ContactsScreen> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final contactsAsync = ref.watch(contactsProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Contacts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(contactsProvider),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search contacts…',
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

          // List
          Expanded(
            child: contactsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 8),
                  const Text('Failed to load contacts'),
                  TextButton(
                    onPressed: () => ref.refresh(contactsProvider),
                    child: const Text('Retry'),
                  ),
                ]),
              ),
              data: (contacts) {
                final q = _searchCtrl.text.toLowerCase();
                final filtered = contacts.where((c) {
                  if (q.isEmpty) return true;
                  return c.fullName.toLowerCase().contains(q) ||
                      (c.email?.toLowerCase().contains(q) ?? false) ||
                      (c.accountName?.toLowerCase().contains(q) ?? false);
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.person_off_outlined, size: 56, color: cs.outline),
                      const SizedBox(height: 8),
                      const Text('No contacts found'),
                    ]),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.refresh(contactsProvider),
                  child: ListView.builder(
                    itemCount: filtered.length,
                    itemBuilder: (_, i) {
                      final c = filtered[i];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: cs.primaryContainer,
                          child: Text(
                            c.initials,
                            style: TextStyle(color: cs.primary, fontWeight: FontWeight.w600, fontSize: 13),
                          ),
                        ),
                        title: Text(c.fullName, style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text([
                          if (c.jobTitle != null) c.jobTitle!,
                          if (c.accountName != null) c.accountName!,
                        ].join(' · ')),
                        trailing: c.email != null
                            ? IconButton(
                                icon: Icon(Icons.email_outlined, size: 18, color: cs.primary),
                                onPressed: () {},
                              )
                            : null,
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
