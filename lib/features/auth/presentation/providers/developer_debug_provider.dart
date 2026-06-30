import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/user_entity.dart';

// StateProvider controlling whether Developer Simulation Mode is active.
// Strictly checks for kDebugMode to prevent any leak to release assemblies.
final devDebugEnabledProvider = StateProvider<bool>((ref) {
  if (!kDebugMode) return false;
  return false; // Disabled by default, toggled via Developer Panel in dev builds
});

// StateProvider holding the active simulated role.
final devSelectedRoleProvider = StateProvider<UserRole>((ref) {
  return UserRole.citizen;
});

// Provider compiling the complete mock UserEntity matching the selected role.
final devMockUserProvider = Provider<UserEntity?>((ref) {
  final isEnabled = ref.watch(devDebugEnabledProvider);
  if (!isEnabled) return null;

  final role = ref.watch(devSelectedRoleProvider);
  
  switch (role) {
    case UserRole.citizen:
      return UserEntity(
        uid: 'dev_mock_citizen_uid_99',
        displayName: 'Aarav Sharma (Simulated)',
        role: UserRole.citizen,
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        email: 'aarav.sharma@mock-civora.in',
        realName: 'Aarav Sharma',
        phoneNumber: '+919876543210',
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
      );
    case UserRole.fieldEngineer:
      return UserEntity(
        uid: 'dev_mock_engineer_uid_88',
        displayName: 'Ravi Kumar (Simulated)',
        role: UserRole.fieldEngineer,
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        email: 'ravi.kumar@municipal-civora.gov.in',
        realName: 'Ravi Kumar',
        phoneNumber: '+919911223344',
        createdAt: DateTime.now().subtract(const Duration(days: 120)),
      );
    case UserRole.supervisor:
      return UserEntity(
        uid: 'dev_mock_supervisor_uid_77',
        displayName: 'Ananya Iyer (Simulated)',
        role: UserRole.supervisor,
        photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        email: 'ananya.iyer@municipal-civora.gov.in',
        realName: 'Ananya Iyer',
        phoneNumber: '+919833445566',
        createdAt: DateTime.now().subtract(const Duration(days: 200)),
      );
    case UserRole.higherAuthority:
      return UserEntity(
        uid: 'dev_mock_authority_uid_66',
        displayName: 'Dr. Devendra Singh (Simulated)',
        role: UserRole.higherAuthority,
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        email: 'devendra.singh@ias-civora.gov.in',
        realName: 'Dr. Devendra Singh',
        phoneNumber: '+919000111222',
        createdAt: DateTime.now().subtract(const Duration(days: 365)),
      );
  }
});
