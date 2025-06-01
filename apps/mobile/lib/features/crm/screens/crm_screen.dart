import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class CrmScreen extends StatelessWidget {
  const CrmScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final modules = [
      _CrmModule(
        icon: Icons.person_add_outlined,
        label: 'Leads',
        description: 'Incoming prospects',
        color: colorScheme.primaryContainer,
        iconColor: colorScheme.primary,
        route: '/crm/leads',
      ),
      _CrmModule(
        icon: Icons.people_outline,
        label: 'Contacts',
        description: 'People & relationships',
        color: colorScheme.secondaryContainer,
        iconColor: colorScheme.secondary,
        route: '/crm/contacts',
      ),
      _CrmModule(
        icon: Icons.business_outlined,
        label: 'Accounts',
        description: 'Companies & orgs',
        color: colorScheme.tertiaryContainer,
        iconColor: colorScheme.tertiary,
        route: '/crm/accounts',
      ),
      _CrmModule(
        icon: Icons.trending_up_outlined,
        label: 'Pipeline',
        description: 'Deals & opportunities',
        color: colorScheme.primaryContainer,
        iconColor: colorScheme.primary,
        route: '/crm/pipeline',
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('CRM'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {/* TODO: search */},
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {/* TODO: quick create */},
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Customer Relationships',
              style: theme.textTheme.titleMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.4,
              ),
              itemCount: modules.length,
              itemBuilder: (context, index) {
                final module = modules[index];
                return _CrmModuleCard(module: module);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _CrmModule {
  final IconData icon;
  final String label;
  final String description;
  final Color color;
  final Color iconColor;
  final String route;

  const _CrmModule({
    required this.icon,
    required this.label,
    required this.description,
    required this.color,
    required this.iconColor,
    required this.route,
  });
}

class _CrmModuleCard extends StatelessWidget {
  final _CrmModule module;
  const _CrmModuleCard({required this.module});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push(module.route),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: module.color,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(module.icon, color: module.iconColor, size: 20),
              ),
              const Spacer(),
              Text(
                module.label,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
              ),
              Text(
                module.description,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
