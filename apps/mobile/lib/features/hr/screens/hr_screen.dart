import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HrScreen extends StatelessWidget {
  const HrScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final modules = [
      _HrModule(icon: Icons.people_outline,       label: 'Employees',      description: 'Team directory',       color: const Color(0xFF6366F1), route: '/hr/employees'),
      _HrModule(icon: Icons.beach_access_outlined, label: 'Leave Requests', description: 'Time-off management', color: const Color(0xFF10B981), route: '/hr/leave'),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('HR')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Human Resources', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: cs.onSurfaceVariant)),
            const SizedBox(height: 16),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.4,
              ),
              itemCount: modules.length,
              itemBuilder: (_, i) => _ModuleCard(module: modules[i]),
            ),
          ],
        ),
      ),
    );
  }
}

class _HrModule { final IconData icon; final String label, description, route; final Color color;
  const _HrModule({required this.icon, required this.label, required this.description, required this.color, required this.route}); }

class _ModuleCard extends StatelessWidget {
  const _ModuleCard({required this.module});
  final _HrModule module;
  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => context.push(module.route),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(width: 40, height: 40,
            decoration: BoxDecoration(color: module.color.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
            child: Icon(module.icon, color: module.color, size: 20)),
          const Spacer(),
          Text(module.label, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
          Text(module.description, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ]),
      ),
    ),
  );
}
