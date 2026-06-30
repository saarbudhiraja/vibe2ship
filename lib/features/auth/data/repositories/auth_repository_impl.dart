import 'dart:io';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;

  AuthRepositoryImpl({required this.remoteDataSource});

  @override
  Stream<UserEntity?> get authStateChanges => remoteDataSource.authStateChanges;

  @override
  Future<Either<Failure, UserEntity>> signInWithGoogle() async {
    try {
      final userModel = await remoteDataSource.signInWithGoogle();
      return Right(userModel);
    } on FirebaseAuthException catch (e) {
      if (e.code == 'ERROR_ABORTED_BY_USER') {
        return const Left(AuthFailure('Sign-in cancelled by user.'));
      } else if (e.code == 'network-request-failed') {
        return const Left(NetworkFailure('Network timed out. Please check connection.'));
      }
      return Left(AuthFailure(e.message ?? 'Google Sign-In failed.'));
    } on FirebaseException catch (e) {
      if (e.code == 'permission-denied') {
        return const Left(PermissionDeniedFailure('Insufficient permissions to access profiles.'));
      }
      return Left(ServerFailure(e.message ?? 'Firestore read/write error occurred.'));
    } on SocketException {
      return const Left(NetworkFailure('Server unreachable. Offline caching initialized.'));
    } catch (e) {
      return Left(ServerFailure('An unexpected error occurred during login: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> signOut() async {
    try {
      await remoteDataSource.signOut();
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure('Logout operation failed: $e'));
    }
  }

  @override
  Future<Either<Failure, UserEntity>> getCurrentUser() async {
    try {
      final userModel = await remoteDataSource.getCurrentUser();
      return Right(userModel);
    } on FirebaseAuthException catch (e) {
      return Left(AuthFailure(e.message ?? 'No active session.'));
    } on FirebaseException catch (e) {
      return Left(ServerFailure(e.message ?? 'Could not retrieve user document.'));
    } catch (e) {
      return Left(ServerFailure('Unexpected error: $e'));
    }
  }
}
