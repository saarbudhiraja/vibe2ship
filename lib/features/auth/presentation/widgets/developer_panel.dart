import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/user_entity.dart';
import '../providers/developer_debug_provider.dart';

class DeveloperPanel extends ConsumerWidget {
  const DeveloperPanel({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Zero footprint/rendering in release builds
    if (!kDebugMode) {
      return const SizedBox.shrink();
    }

    final isSimulating = ref.watch(devDebugEnabledProvider);
    final activeRole = ref.watch(devSelectedRoleProvider);
    final mockUser = ref.watch(devMockUserProvider);

    return Card(
      elevation: 6,
      margin: const EdgeInsets.symmetric(vertical: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Colors.amber, width: 1.5),
      ),
      color: Colors.amber.shade50.withOpacity(0.08),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                Row(
                  children: const [
                    Icon(Icons.bug_report, color: Colors.amber),
                    SizedBox(width: 8),
                    Text(
                      'DEVELOPER SANDBOX PANEL',
                      style: TextStyle(
                        fontFamily: 'JetBrains Mono',
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.amber,
                        letterSpacing: 1.1,
                      ),
                    ),
                  ],
                ),
                Switch.adaptive(
                  value: isSimulating,
                  activeColor: Colors.amber,
                  onChanged: (val) {
                    ref.read(devDebugEnabledProvider.notifier).state = val;
                  },
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              'Allows developers to bypass OAuth registration and instantly switch role contexts to verify multi-tier RBAC routing rules.',
              style: TextStyle(fontSize: 11, color: Colors.grey),
            ),
            if (isSimulating) ...[
              const Divider(color: Colors.amber, height: 24),
              const Text(
                'Select Role Assertion Context:',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: UserRole.values.map((role) {
                  final isSelected = activeRole == role;
                  return ChoiceChip(
                    label: Text(
                      role.displayName,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? Colors.black : Colors.grey,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: Colors.amber,
                    onSelected: (selected) {
                      if (selected) {
                        ref.read(devSelectedRoleProvider.notifier).state = role;
                      }
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              if (mockUser != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black26,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.grey.withOpacity(0.2)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'SIMULATED SCHEMA PARALLEL DATA:',
                        style: TextStyle(
                          fontFamily: 'JetBrains Mono',
                          fontSize: 10,
                          color: Colors.amberAccent,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text('UID: ${mockUser.uid}', style: const TextStyle(fontSize: 11, fontFamily: 'JetBrains Mono')),
                      Text('DisplayName: ${mockUser.displayName}', style: const TextStyle(fontSize: 11)),
                      Text('Email: ${mockUser.email}', style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic)),
                      Text('Assigned Role: ${mockUser.role.displayName.toUpperCase()}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
            ] else ...[
              const SizedBox(height: 8),
              const Text(
                '● Standard Firebase Google Auth Mode is Active.',
                style: TextStyle(fontSize: 11, color: Colors.greenAccent, fontWeight: FontWeight.bold),
              ),
            ]
          ],
        ),
      ),
    );
  }
}
