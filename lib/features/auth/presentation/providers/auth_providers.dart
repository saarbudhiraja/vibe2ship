import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/auth_remote_data_source.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../domain/usecases/get_current_user.dart';
import '../../domain/usecases/sign_in_with_google.dart';
import '../../domain/usecases/sign_out.dart';
import 'developer_debug_provider.dart';

// Provider for the raw Data Source
final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  return AuthRemoteDataSourceImpl();
});

// Provider for the Repository Implementation
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final remoteSource = ref.watch(authRemoteDataSourceProvider);
  return AuthRepositoryImpl(remoteDataSource: remoteSource);
});

// Providers for Domain Use Cases
final signInWithGoogleUseCaseProvider = Provider<SignInWithGoogle>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return SignInWithGoogle(repository);
});

final signOutUseCaseProvider = Provider<SignOut>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return SignOut(repository);
});

final getCurrentUserUseCaseProvider = Provider<GetCurrentUser>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return GetCurrentUser(repository);
});

// StreamProvider mapping auth changes. Intercepts with Developer Debug Mode when enabled.
final authStateChangesProvider = StreamProvider<UserEntity?>((ref) {
  final isDebugEnabled = ref.watch(devDebugEnabledProvider);
  if (isDebugEnabled) {
    // If Dev Debug Mode is active, emit the simulated user role
    final mockUser = ref.watch(devMockUserProvider);
    return Stream.value(mockUser);
  }

  final repository = ref.watch(authRepositoryProvider);
  return repository.authStateChanges;
});

// Unified Notifier managing the interactive UI state (Idle, Loading, Authenticating, Success, Error)
class AuthNotifier extends StateNotifier<AsyncValue<UserEntity?>> {
  final SignInWithGoogle _signInWithGoogle;
  final SignOut _signOut;
  final GetCurrentUser _getCurrentUser;

  AuthNotifier({
    required SignInWithGoogle signInWithGoogle,
    required SignOut signOut,
    required GetCurrentUser getCurrentUser,
  })  : _signInWithGoogle = signInWithGoogle,
        _signOut = signOut,
        _getCurrentUser = getCurrentUser,
        super(const AsyncValue.data(null)) {
    _loadCurrentUserOnStartup();
  }

  Future<void> _loadCurrentUserOnStartup() async {
    state = const AsyncValue.loading();
    final result = await _getCurrentUser();
    result.fold(
      (failure) => state = const AsyncValue.data(null), // Silent ignore on startup (guest mode)
      (user) => state = AsyncValue.data(user),
    );
  }

  Future<void> login() async {
    state = const AsyncValue.loading();
    final result = await _signInWithGoogle();
    result.fold(
      (failure) => state = AsyncValue.error(failure.message, StackTrace.current),
      (user) => state = AsyncValue.data(user),
    );
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    final result = await _signOut();
    result.fold(
      (failure) => state = AsyncValue.error(failure.message, StackTrace.current),
      (_) => state = const AsyncValue.data(null),
    );
  }
}

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AsyncValue<UserEntity?>>((ref) {
  return AuthNotifier(
    signInWithGoogle: ref.watch(signInWithGoogleUseCaseProvider),
    signOut: ref.watch(signOutUseCaseProvider),
    getCurrentUser: ref.watch(getCurrentUserUseCaseProvider),
  );
});
