import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:omnivara_mobile/core/auth/auth_provider.dart';
import 'package:omnivara_mobile/core/network/api_client.dart';

// ── Models ────────────────────────────────────────────────────────────────────

class Project {
  const Project({
    required this.id,
    required this.name,
    required this.status,
    required this.taskCount,
    required this.completedTaskCount,
    this.dueDate,
    this.description,
  });

  final String id;
  final String name;
  final String status;
  final int taskCount;
  final int completedTaskCount;
  final DateTime? dueDate;
  final String? description;

  double get progress => taskCount > 0 ? completedTaskCount / taskCount : 0;

  Color get statusColor => switch (status) {
    'active'    => const Color(0xFF10B981),
    'on_hold'   => const Color(0xFFF59E0B),
    'completed' => const Color(0xFF6366F1),
    'cancelled' => const Color(0xFFEF4444),
    _           => const Color(0xFF94A3B8),
  };

  factory Project.fromJson(Map<String, dynamic> json) => Project(
        id:                 json['id'] as String,
        name:               json['name'] as String,
        status:             json['status'] as String? ?? 'active',
        taskCount:          json['taskCount'] as int? ?? 0,
        completedTaskCount: json['completedTaskCount'] as int? ?? 0,
        dueDate:            json['dueDate'] != null
            ? DateTime.tryParse(json['dueDate'] as String)
            : null,
        description: json['description'] as String?,
      );
}

// ── Provider ──────────────────────────────────────────────────────────────────

final projectsProvider = FutureProvider.autoDispose<List<Project>>((ref) async {
  final orgId = ref.watch(currentOrgIdProvider);
  if (orgId == null || orgId.isEmpty) return [];
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/orgs/$orgId/projects', queryParameters: {'limit': 30});
  final list = (res.data['data'] ?? res.data) as List<dynamic>;
  return list.map((e) => Project.fromJson(e as Map<String, dynamic>)).toList();
});

// ── Screen ─────────────────────────────────────────────────────────────────────

class ProjectsScreen extends ConsumerStatefulWidget {
  const ProjectsScreen({super.key});

  @override
  ConsumerState<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends ConsumerState<ProjectsScreen> {
  String _statusFilter = 'all';
  static const _filters = ['all', 'active', 'on_hold', 'completed'];

  @override
  Widget build(BuildContext context) {
    final projectsAsync = ref.watch(projectsProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Projects'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(projectsProvider),
          ),
        ],
      ),
      body: Column(
        children: [
          // Status filter chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              scrollDirection: Axis.horizontal,
              itemCount: _filters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final f = _filters[i];
                final label = f == 'on_hold' ? 'On Hold' : f[0].toUpperCase() + f.substring(1);
                return FilterChip(
                  label: Text(label),
                  selected: _statusFilter == f,
                  onSelected: (_) => setState(() => _statusFilter = f),
                );
              },
            ),
          ),

          // Project list
          Expanded(
            child: projectsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 8),
                  const Text('Failed to load projects'),
                  TextButton(
                    onPressed: () => ref.refresh(projectsProvider),
                    child: const Text('Retry'),
                  ),
                ]),
              ),
              data: (projects) {
                final filtered = projects
                    .where((p) => _statusFilter == 'all' || p.status == _statusFilter)
                    .toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.folder_open_outlined, size: 56, color: cs.outline),
                      const SizedBox(height: 8),
                      Text(
                        projects.isEmpty ? 'No projects yet' : 'No ${_statusFilter} projects',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ]),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.refresh(projectsProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, i) => _ProjectCard(project: filtered[i]),
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

// ── Project card ──────────────────────────────────────────────────────────────

class _ProjectCard extends StatelessWidget {
  const _ProjectCard({required this.project});
  final Project project;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs    = theme.colorScheme;
    final color = project.statusColor;
    final pct   = (project.progress * 100).round();

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: cs.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row
            Row(children: [
              Container(
                width: 10, height: 10,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(project.name,
                    style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  project.status.replaceAll('_', ' '),
                  style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600),
                ),
              ),
            ]),

            if (project.description != null) ...[
              const SizedBox(height: 6),
              Text(project.description!, style: theme.textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant), maxLines: 2, overflow: TextOverflow.ellipsis),
            ],

            const SizedBox(height: 12),

            // Progress bar
            Row(children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: project.progress,
                    minHeight: 6,
                    backgroundColor: cs.surfaceContainerHighest,
                    valueColor: AlwaysStoppedAnimation<Color>(color),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text('$pct%', style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600, color: color)),
            ]),

            const SizedBox(height: 8),

            // Meta row
            Row(children: [
              Icon(Icons.task_alt_outlined, size: 14, color: cs.onSurfaceVariant),
              const SizedBox(width: 4),
              Text('${project.completedTaskCount}/${project.taskCount} tasks',
                  style: theme.textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
              if (project.dueDate != null) ...[
                const SizedBox(width: 12),
                Icon(Icons.calendar_today_outlined, size: 14, color: cs.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  DateFormat('MMM d').format(project.dueDate!),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: project.dueDate!.isBefore(DateTime.now()) && project.status == 'active'
                        ? Colors.red
                        : cs.onSurfaceVariant,
                  ),
                ),
              ],
            ]),
          ],
        ),
      ),
    );
  }
}
