import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_providers.dart';
import '../widgets/developer_panel.dart';
import '../widgets/responsive_login_layout.dart';

class LoginView extends ConsumerWidget {
  const LoginView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateChangesProvider);

    // Show a snackbar or alert if login failed
    ref.listen(authNotifierProvider, (previous, next) {
      next.whenOrNull(
        error: (error, stackTrace) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Authentication Error: $error',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              backgroundColor: Theme.of(context).colorScheme.error,
              behavior: SnackBarBehavior.floating,
            ),
          );
        },
      );
    });

    return Scaffold(
      body: SafeArea(
        child: ResponsiveLoginLayout(
          logoAndBranding: _buildBranding(context),
          promotionalHero: _buildPromotionalHero(context),
          loginCard: _buildLoginCard(context, ref, authState),
        ),
      ),
    );
  }

  Widget _buildBranding(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: colorScheme.primary.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.location_city,
                size: 28,
                color: colorScheme.primary,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'CIVORA',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                letterSpacing: 2.0,
                color: colorScheme.onSurface,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          'Unified Municipal Reporting & Resource Allocation Platform',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: colorScheme.primary,
          ),
        ),
      ],
    );
  }

  Widget _buildPromotionalHero(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Bridging the Gap Between Citizens and City Management',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            letterSpacing: -0.5,
            height: 1.2,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Civora is powered by a robust split-profile Clean Architecture, enabling real-time civic complaints, automated geohash duplicate detection, and immediate field engineer task dispatches.',
          style: TextStyle(
            fontSize: 14,
            color: colorScheme.onSurfaceVariant,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 24),
        _buildBullet(
          context,
          Icons.verified,
          'Multi-Tier Roles',
          'Automated routing paths tailored for Citizens, Engineers, and Supervisors.',
        ),
        _buildBullet(
          context,
          Icons.security_rounded,
          'Split-Collection Privacy',
          'PII is encrypted and strictly isolated from public civic metrics.',
        ),
        _buildBullet(
          context,
          Icons.offline_pin_rounded,
          'Offline synchronization',
          'Draft tickets offline. Sync to Firestore automatically upon reconnection.',
        ),
      ],
    );
  }

  Widget _buildBullet(BuildContext context, IconData icon, String title, String body) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                Text(
                  body,
                  style: TextStyle(fontSize: 12, color: colorScheme.onSurfaceVariant),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginCard(BuildContext context, WidgetRef ref, AsyncValue authState) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLoading = authState.isLoading;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text(
          'Access Platform',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'Sign in with your organizational or civilian credentials.',
          style: TextStyle(fontSize: 12, color: colorScheme.onSurfaceVariant),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
        ElevatedButton.icon(
          onPressed: isLoading
          ? null
          : () async {
            await ref.read(authNotifierProvider.notifier).login();
            },
          icon: isLoading
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.account_circle, size: 20),
          label: const Text(
            'Continue with Google',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          ),
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: colorScheme.surfaceVariant.withOpacity(0.4),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: colorScheme.outlineVariant.withOpacity(0.3)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.info_outline, size: 16, color: colorScheme.secondary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Privacy Note: Your verified email and real name are mapped strictly to private collections to prevent PII leakage under municipal compliance rules.',
                  style: TextStyle(fontSize: 10, color: colorScheme.onSurfaceVariant, height: 1.4),
                ),
              ),
            ],
          ),
        ),
        // Render Developer Panel in Debug builds
        if (kDebugMode) ...[
          const SizedBox(height: 16),
          const DeveloperPanel(),
        ],
      ],
    );
  }
}
