import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class FinanceScreen extends StatelessWidget {
  const FinanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    final modules = [
      _FinanceModule(
        icon: Icons.receipt_long_outlined,
        label: 'Invoices',
        description: 'Bills & payments',
        color: const Color(0xFF10B981),
        route: '/finance/invoices',
      ),
      _FinanceModule(
        icon: Icons.credit_card_outlined,
        label: 'Expenses',
        description: 'Team spending',
        color: const Color(0xFFF59E0B),
        route: '/finance/expenses',
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Finance')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Financial Management',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(color: cs.onSurfaceVariant),
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
              itemBuilder: (context, i) => _ModuleCard(module: modules[i]),
            ),
          ],
        ),
      ),
    );
  }
}

class _FinanceModule {
  final IconData icon;
  final String label;
  final String description;
  final Color color;
  final String route;
  const _FinanceModule({required this.icon, required this.label, required this.description, required this.color, required this.route});
}

class _ModuleCard extends StatelessWidget {
  const _ModuleCard({required this.module});
  final _FinanceModule module;

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
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: module.color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(module.icon, color: module.color, size: 20),
              ),
              const Spacer(),
              Text(module.label, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
              Text(module.description, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ],
          ),
        ),
      ),
    );
  }
}
