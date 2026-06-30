enum UserRole {
  citizen,
  fieldEngineer,
  supervisor,
  higherAuthority;

  String toJson() {
    switch (this) {
      case UserRole.citizen:
        return 'citizen';
      case UserRole.fieldEngineer:
        return 'field_engineer';
      case UserRole.supervisor:
        return 'supervisor';
      case UserRole.higherAuthority:
        return 'higher_authority';
    }
  }

  static UserRole fromJson(String value) {
    switch (value) {
      case 'field_engineer':
        return UserRole.fieldEngineer;
      case 'supervisor':
        return UserRole.supervisor;
      case 'higher_authority':
        return UserRole.higherAuthority;
      case 'citizen':
      default:
        return UserRole.citizen;
    }
  }

  String get displayName {
    switch (this) {
      case UserRole.citizen:
        return 'Citizen';
      case UserRole.fieldEngineer:
        return 'Field Engineer';
      case UserRole.supervisor:
        return 'Supervisor';
      case UserRole.higherAuthority:
        return 'Higher Authority';
    }
  }
}

class UserEntity {
  final String uid;
  // Public Profile Data
  final String displayName;
  final UserRole role;
  final String? photoUrl;

  // Private Profile Data (Split-Collection pattern)
  final String email;
  final String realName;
  final String? phoneNumber;
  final DateTime createdAt;

  const UserEntity({
    required this.uid,
    required this.displayName,
    required this.role,
    this.photoUrl,
    required this.email,
    required this.realName,
    this.phoneNumber,
    required this.createdAt,
  });

  UserEntity copyWith({
    String? uid,
    String? displayName,
    UserRole? role,
    String? photoUrl,
    String? email,
    String? realName,
    String? phoneNumber,
    DateTime? createdAt,
  }) {
    return UserEntity(
      uid: uid ?? this.uid,
      displayName: displayName ?? this.displayName,
      role: role ?? this.role,
      photoUrl: photoUrl ?? this.photoUrl,
      email: email ?? this.email,
      realName: realName ?? this.realName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toPublicFirestore() {
    return {
      'displayName': displayName,
      'role': role.toJson(),
      'photoUrl': photoUrl,
    };
  }

  Map<String, dynamic> toPrivateFirestore() {
    return {
      'email': email,
      'realName': realName,
      'phoneNumber': phoneNumber,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
