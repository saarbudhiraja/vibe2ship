abstract class Failure {
  final String message;
  const Failure(this.message);

  @override
  String toString() => message;
}

class ServerFailure extends Failure {
  const ServerFailure([super.message = "A database or server error occurred."]);
}

class CacheFailure extends Failure {
  const CacheFailure([super.message = "A local cache retrieval error occurred."]);
}

class NetworkFailure extends Failure {
  const NetworkFailure([super.message = "No internet connection detected. Saved to offline queue."]);
}

class AuthFailure extends Failure {
  const AuthFailure([super.message = "Authentication failed."]);
}

class PermissionDeniedFailure extends Failure {
  const PermissionDeniedFailure([super.message = "Access denied. Insufficient administrative permissions."]);
}

class DuplicateCollisionFailure extends Failure {
  const DuplicateCollisionFailure([super.message = "A duplicate report collision was detected."]);
}
