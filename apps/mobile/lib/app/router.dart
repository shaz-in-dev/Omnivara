import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:omnivara_mobile/core/auth/auth_provider.dart';
import 'package:omnivara_mobile/features/auth/screens/login_screen.dart';
import 'package:omnivara_mobile/features/crm/screens/contacts_screen.dart';
import 'package:omnivara_mobile/features/crm/screens/crm_screen.dart';
import 'package:omnivara_mobile/features/crm/screens/leads_screen.dart';
import 'package:omnivara_mobile/features/dashboard/screens/dashboard_screen.dart';
import 'package:omnivara_mobile/features/finance/screens/expenses_screen.dart';
import 'package:omnivara_mobile/features/finance/screens/finance_screen.dart';
import 'package:omnivara_mobile/features/finance/screens/invoices_screen.dart';
import 'package:omnivara_mobile/features/helpdesk/screens/helpdesk_screen.dart';
import 'package:omnivara_mobile/features/hr/screens/employees_screen.dart';
import 'package:omnivara_mobile/features/hr/screens/hr_screen.dart';
import 'package:omnivara_mobile/features/hr/screens/leave_requests_screen.dart';
import 'package:omnivara_mobile/features/projects/screens/projects_screen.dart';
import 'package:omnivara_mobile/features/shell/screens/shell_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/dashboard',
    redirect: (context, state) {
      final isLoading       = authState.isLoading;
      final isAuthenticated = authState.valueOrNull is AuthAuthenticated;
      final isLoginPage     = state.matchedLocation == '/login';

      if (isLoading) return null;
      if (!isAuthenticated && !isLoginPage) return '/login';
      if (isAuthenticated && isLoginPage) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => ShellScreen(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),

          // ── CRM ─────────────────────────────────────────────────────────────
          GoRoute(
            path: '/crm',
            builder: (context, state) => const CrmScreen(),
            routes: [
              GoRoute(path: 'leads',    builder: (_, __) => const LeadsScreen()),
              GoRoute(path: 'contacts', builder: (_, __) => const ContactsScreen()),
              GoRoute(path: 'accounts', builder: (_, __) => const _ComingSoon(title: 'Accounts', icon: Icons.business_outlined)),
              GoRoute(path: 'pipeline', builder: (_, __) => const _ComingSoon(title: 'Pipeline',  icon: Icons.trending_up_outlined)),
            ],
          ),

          // ── Helpdesk ────────────────────────────────────────────────────────
          GoRoute(
            path: '/helpdesk',
            builder: (context, state) => const HelpdeskScreen(),
          ),

          // ── Projects ────────────────────────────────────────────────────────
          GoRoute(
            path: '/projects',
            builder: (context, state) => const ProjectsScreen(),
          ),

          // ── Finance ─────────────────────────────────────────────────────────
          GoRoute(
            path: '/finance',
            builder: (context, state) => const FinanceScreen(),
            routes: [
              GoRoute(path: 'invoices', builder: (_, __) => const InvoicesScreen()),
              GoRoute(path: 'expenses', builder: (_, __) => const ExpensesScreen()),
            ],
          ),

          // ── HR ───────────────────────────────────────────────────────────────
          GoRoute(
            path: '/hr',
            builder: (context, state) => const HrScreen(),
            routes: [
              GoRoute(path: 'employees', builder: (_, __) => const EmployeesScreen()),
              GoRoute(path: 'leave',     builder: (_, __) => const LeaveRequestsScreen()),
            ],
          ),
        ],
      ),
    ],
  );
});

class _ComingSoon extends StatelessWidget {
  const _ComingSoon({required this.title, required this.icon});
  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 64, color: cs.outlineVariant),
          const SizedBox(height: 16),
          Text('$title — coming soon', style: Theme.of(context).textTheme.titleMedium),
        ]),
      ),
    );
  }
}
