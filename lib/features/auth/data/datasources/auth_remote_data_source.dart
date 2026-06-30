import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../models/user_model.dart';
import '../../domain/entities/user_entity.dart';

abstract class AuthRemoteDataSource {
  /// Streams the authenticated user model changes.
  Stream<UserModel?> get authStateChanges;

  /// Authenticates using Google Sign-In and resolves/creates Firestore profiles.
  Future<UserModel> signInWithGoogle();

  /// Sign out from Google and Firebase.
  Future<void> signOut();

  /// Gets the current authenticated user profile.
  Future<UserModel> getCurrentUser();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;
  final GoogleSignIn _googleSignIn;

  AuthRemoteDataSourceImpl({
    FirebaseAuth? auth,
    FirebaseFirestore? firestore,
    GoogleSignIn? googleSignIn,
  })  : _auth = auth ?? FirebaseAuth.instance,
        _firestore = firestore ?? FirebaseFirestore.instance,
        _googleSignIn = googleSignIn ?? GoogleSignIn();

  @override
  Stream<UserModel?> get authStateChanges {
    return _auth.authStateChanges().asyncMap((firebaseUser) async {
      if (firebaseUser == null) return null;
      return await _fetchUserModel(firebaseUser.uid, firebaseUser.email ?? '', firebaseUser.displayName ?? '');
    });
  }

  @override
  Future<UserModel> signInWithGoogle() async {
    final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
    if (googleUser == null) {
      throw FirebaseAuthException(
        code: 'ERROR_ABORTED_BY_USER',
        message: 'Google Sign-In was cancelled by the user.',
      );
    }

    final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
    final AuthCredential credential = GoogleAuthProvider.getCredential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    final UserCredential userCredential = await _auth.signInWithCredential(credential);
    final User? firebaseUser = userCredential.user;

    if (firebaseUser == null) {
      throw FirebaseAuthException(
        code: 'ERROR_NULL_USER',
        message: 'Firebase User resolved to null after Google authentication.',
      );
    }

    // Retrieve or create the split-collection profiles in Firestore
    return await _getOrCreateProfile(firebaseUser);
  }

  @override
  Future<void> signOut() async {
    await _googleSignIn.signOut();
    await _auth.signOut();
  }

  @override
  Future<UserModel> getCurrentUser() async {
    final User? firebaseUser = _auth.currentUser;
    if (firebaseUser == null) {
      throw FirebaseAuthException(
        code: 'ERROR_NO_USER',
        message: 'No authenticated user session found.',
      );
    }
    return await _fetchUserModel(firebaseUser.uid, firebaseUser.email ?? '', firebaseUser.displayName ?? '');
  }

  /// Internal helper to fetch split Firestore profiles
  Future<UserModel> _fetchUserModel(String uid, String fallbackEmail, String fallbackName) async {
    final publicDoc = await _firestore.collection('users').doc(uid).get();
    final privateDoc = await _firestore.collection('users').doc(uid).collection('private').doc('info').get();

    if (publicDoc.exists && privateDoc.exists) {
      return UserModel.fromFirestore(
        uid: uid,
        publicData: publicDoc.data()!,
        privateData: privateDoc.data()!,
      );
    } else {
      // Create profile if missing but user is authenticated
      final User? currentUser = _auth.currentUser;
      if (currentUser != null) {
        return await _getOrCreateProfile(currentUser);
      }
      throw FirebaseException(
        plugin: 'cloud_firestore',
        message: 'User profiles do not exist for uid: $uid',
      );
    }
  }

  /// Implements profile creation on first successful login (split-profile pattern)
  Future<UserModel> _getOrCreateProfile(User firebaseUser) async {
    final uid = firebaseUser.uid;
    final publicRef = _firestore.collection('users').doc(uid);
    final privateRef = _firestore.collection('users').doc(uid).collection('private').doc('info');

    final publicDoc = await publicRef.get();
    final privateDoc = await privateRef.get();

    if (publicDoc.exists && privateDoc.exists) {
      return UserModel.fromFirestore(
        uid: uid,
        publicData: publicDoc.data()!,
        privateData: privateDoc.data()!,
      );
    }

    // Default configuration for a new joining user
    final String email = firebaseUser.email ?? '';
    final String displayName = firebaseUser.displayName ?? 'Civora Citizen';
    final String? photoUrl = firebaseUser.photoUrl;

    final newUser = UserModel.fromFirebaseUser(
      uid: uid,
      email: email,
      displayName: displayName,
      photoUrl: photoUrl,
      defaultRole: UserRole.citizen, // Standard users sign up as citizens
    );

    // Save split-collection profile atomically in Firestore using a write batch
    final batch = _firestore.batch();
    batch.set(publicRef, newUser.toPublicFirestore());
    batch.set(privateRef, newUser.toPrivateFirestore());
    await batch.commit();

    return newUser;
  }
}
