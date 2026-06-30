import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_entity.dart';

abstract class AuthRepository {
  /// Streams the authenticated user's state. Resolves to null if signed out.
  Stream<UserEntity?> get authStateChanges;

  /// Performs Google Sign-In, creates split public/private profiles on first join,
  /// and resolves the user entity with correct roles.
  Future<Either<Failure, UserEntity>> signInWithGoogle();

  /// Logs the user out of Firebase and Google Sign-In.
  Future<Either<Failure, void>> signOut();

  /// Retrieves the current authenticated user and resolves their profile role.
  Future<Either<Failure, UserEntity>> getCurrentUser();
}
