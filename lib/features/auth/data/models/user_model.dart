import '../../domain/entities/user_entity.dart';

class UserModel extends UserEntity {
  const UserModel({
    required super.uid,
    required super.displayName,
    required super.role,
    super.photoUrl,
    required super.email,
    required super.realName,
    super.phoneNumber,
    required super.createdAt,
  });

  /// Decodes public and private Firestore collections into a single UserModel
  factory UserModel.fromFirestore({
    required String uid,
    required Map<String, dynamic> publicData,
    required Map<String, dynamic> privateData,
  }) {
    return UserModel(
      uid: uid,
      displayName: publicData['displayName'] as String? ?? 'Anonymous Citizen',
      role: UserRole.fromJson(publicData['role'] as String? ?? 'citizen'),
      photoUrl: publicData['photoUrl'] as String?,
      email: privateData['email'] as String? ?? '',
      realName: privateData['realName'] as String? ?? 'Anonymous',
      phoneNumber: privateData['phoneNumber'] as String?,
      createdAt: privateData['createdAt'] != null
          ? DateTime.parse(privateData['createdAt'] as String)
          : DateTime.now(),
    );
  }

  /// Helper to generate a default UserModel on first login
  factory UserModel.fromFirebaseUser({
    required String uid,
    required String email,
    required String displayName,
    String? photoUrl,
    UserRole defaultRole = UserRole.citizen,
  }) {
    return UserModel(
      uid: uid,
      displayName: displayName,
      role: defaultRole,
      photoUrl: photoUrl,
      email: email,
      realName: displayName,
      phoneNumber: null,
      createdAt: DateTime.now(),
    );
  }
}
