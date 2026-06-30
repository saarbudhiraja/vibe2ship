import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/domain/entities/user_entity.dart';
import '../../features/auth/presentation/providers/auth_providers.dart';
import '../../features/auth/presentation/views/login_view.dart';
import '../../features/complaints/presentation/views/complaint_reporting_view.dart';
import '../../features/complaints/presentation/views/authority_dashboard_view.dart';

// Key for accessing navigator state globally
final rootNavigatorKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  // Listen to auth changes so the router re-evaluates when auth state changes
  final authStateAsync = ref.watch(authStateChangesProvider);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/login',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      // If the auth state is loading, delay redirect evaluation
      if (authStateAsync.isLoading) return null;

      final user = authStateAsync.value;
      final isLoggingIn = state.uri.toString() == '/login';

      // 1. Unauthenticated users are strictly guarded and forced to /login
      if (user == null) {
        return isLoggingIn ? null : '/login';
      }

      // 2. Authenticated users going to login are redirected to their designated role portals
      if (isLoggingIn) {
        return _getDashboardRouteForRole(user.role);
      }

      // 3. Multi-tier Role Guard asserting path authorization (RBAC)
      final currentPath = state.uri.toString();
      
      if (currentPath.startsWith('/citizen') && user.role != UserRole.citizen) {
        return _getDashboardRouteForRole(user.role);
      }
      if (currentPath.startsWith('/engineer') && user.role != UserRole.fieldEngineer) {
        return _getDashboardRouteForRole(user.role);
      }
      if (currentPath.startsWith('/supervisor') && user.role != UserRole.supervisor) {
        return _getDashboardRouteForRole(user.role);
      }
      if (currentPath.startsWith('/authority') && user.role != UserRole.higherAuthority) {
        return _getDashboardRouteForRole(user.role);
      }

      // Let user access authorized paths
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginView(),
      ),
      
      // Portal 1: Citizens (Issue Reporting Hub)
      GoRoute(
        path: '/citizen/dashboard',
        builder: (context, state) => const ComplaintReportingView(),
      ),

      // Portal 2: Field Engineers (Dispatched Tasks Worklists)
      GoRoute(
        path: '/engineer/tasklist',
        builder: (context, state) => const AuthorityDashboardView(),
      ),

      // Portal 3: Supervisors (Audits & Action Approvals)
      GoRoute(
        path: '/supervisor/workorders',
        builder: (context, state) => const AuthorityDashboardView(),
      ),

      // Portal 4: Executive Authorities (Macro Metrics AI Insights)
      GoRoute(
        path: '/authority/insights',
        builder: (context, state) => const AuthorityDashboardView(),
      ),
    ],
  );
});

/// Determines routing routes depending on UserRole permissions
String _getDashboardRouteForRole(UserRole role) {
  switch (role) {
    case UserRole.citizen:
      return '/citizen/dashboard';
    case UserRole.fieldEngineer:
      return '/engineer/tasklist';
    case UserRole.supervisor:
      return '/supervisor/workorders';
    case UserRole.higherAuthority:
      return '/authority/insights';
  }
}
