import { FileNode, FirestoreCollection, AIPipeline } from '../types';

export const flutterCleanArchitecture: FileNode = {
  name: 'civora_app',
  type: 'folder',
  description: 'The root of the Flutter Android Clean Architecture codebase, designed for high scalability, separation of concerns, and easy testability using Riverpod Feature-First layout.',
  children: [
    {
      name: 'android',
      type: 'folder',
      description: 'Platform-specific Android configurations, Gradle builds, manifest files, and permission handlers (Camera, Microphones, GPS).',
    },
    {
      name: 'lib',
      type: 'folder',
      description: 'The core Dart codebase. Organized into feature-driven domain/data/presentation layers to isolate state management, data APIs, and M3 design.',
      children: [
        {
          name: 'main.dart',
          type: 'file',
          description: 'Application entry point. Initializes Firebase Core, wraps the app tree inside a Riverpod ProviderScope, and bootstraps GoRouter configurations.',
          codeSnippet: `import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/civora_theme.dart';
import 'core/router/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Wrapped in ProviderScope for Riverpod state management
  runApp(
    const ProviderScope(
      child: CivoraApp(),
    ),
  );
}

class CivoraApp extends ConsumerWidget {
  const CivoraApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProivder);
    
    return MaterialApp.router(
      title: 'Civora',
      theme: CivoraTheme.lightTheme,
      darkTheme: CivoraTheme.darkTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}`
        },
        {
          name: 'core',
          type: 'folder',
          description: 'Shared, reusable foundational codebase. Completely independent of any specific UI or feature business logic.',
          children: [
            {
              name: 'config',
              type: 'folder',
              description: 'Centralized environment and configuration metrics containing keys, endpoints, and flags.',
              children: [
                {
                  name: 'app_config.dart',
                  type: 'file',
                  description: 'Handles environments (Dev, Staging, Prod), routing configs, and dynamic geohash precision multipliers.',
                  codeSnippet: `import 'package:flutter_riverpod/flutter_riverpod.dart';

enum Environment { dev, staging, prod }

class AppConfig {
  final Environment environment;
  final String apiBaseUrl;
  final int defaultGeohashPrecision;
  final bool enableOfflinePersistence;

  const AppConfig({
    required this.environment,
    required this.apiBaseUrl,
    this.defaultGeohashPrecision = 7,
    this.enableOfflinePersistence = true,
  });
}

final appConfigProvider = Provider<AppConfig>((ref) {
  return const AppConfig(
    environment: Environment.dev,
    apiBaseUrl: 'https://api.civora.org/v1',
    defaultGeohashPrecision: 7,
    enableOfflinePersistence: true,
  );
});`
                }
              ]
            },
            {
              name: 'logging',
              type: 'folder',
              description: 'Comprehensive, leveled application logger with dynamic terminal filters and persistent logs.',
              children: [
                {
                  name: 'civora_logger.dart',
                  type: 'file',
                  description: 'Abstracted console & cloud tracker supporting Debug, Info, Warning, and Critical levels.',
                  codeSnippet: `import 'dart:developer' as developer;

enum LogLevel { debug, info, warning, error }

class CivoraLogger {
  static void log(LogLevel level, String message, {Object? error, StackTrace? stackTrace}) {
    final timestamp = DateTime.now().toIso8601String();
    final tag = '[Civora:\${level.name.toUpperCase()}]';
    final fullMessage = '\$timestamp \$tag \$message';
    
    developer.log(
      fullMessage,
      name: 'civora',
      error: error,
      stackTrace: stackTrace,
    );
  }

  static void debug(String message) => log(LogLevel.debug, message);
  static void info(String message) => log(LogLevel.info, message);
  static void warning(String message) => log(LogLevel.warning, message);
  static void error(String message, {Object? error, StackTrace? stackTrace}) => 
      log(LogLevel.error, message, error: error, stackTrace: stackTrace);
}`
                }
              ]
            },
            {
              name: 'firebase',
              type: 'folder',
              description: 'Bootstraps Firebase suite and configures offline memory size restrictions.',
              children: [
                {
                  name: 'firebase_service.dart',
                  type: 'file',
                  description: 'Sequential initializer configuring Auth instances and unlimited Firestore cached pools.',
                  codeSnippet: `import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../logging/civora_logger.dart';

class FirebaseService {
  final FirebaseFirestore firestore;
  final FirebaseAuth auth;

  FirebaseService({required this.firestore, required this.auth});

  static Future<FirebaseService> initialize() async {
    CivoraLogger.info("Initializing Firebase Core Services...");
    final app = await Firebase.initializeApp();
    final firestore = FirebaseFirestore.instanceFor(app: app);
    
    // Configure robust offline cache settings
    firestore.settings = const Settings(
      persistenceEnabled: true,
      cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
    );
    
    CivoraLogger.info("Firebase Services Successfully Initialized with Unlimited Persistence Cache.");
    return FirebaseService(
      firestore: firestore,
      auth: FirebaseAuth.instance,
    );
  }
}

final firebaseServiceProvider = Provider<FirebaseService>((ref) {
  throw UnimplementedError("FirebaseService not initialized. Initialize inside main() and override the provider.");
});`
                }
              ]
            },
            {
              name: 'error',
              type: 'folder',
              description: 'Defines central failure objects (ServerFailure, CacheFailure, NetworkFailure, DuplicateFailure) mapped from Firestore and API exceptions.',
              children: [
                {
                  name: 'failures.dart',
                  type: 'file',
                  description: 'Central definition of Failure contracts used by Clean Architecture repositories.',
                  codeSnippet: `abstract class Failure {
  final String message;
  const Failure(this.message);
}

class ServerFailure extends Failure {
  const ServerFailure([super.message = "Database error occurred"]);
}

class CacheFailure extends Failure {
  const CacheFailure([super.message = "Local storage error occurred"]);
}

class NetworkFailure extends Failure {
  const NetworkFailure([super.message = "No internet connection detected"]);
}`
                },
                {
                  name: 'error_handler.dart',
                  type: 'file',
                  description: 'Catches exceptions, transforms them to Failures, and automatically logs error telemetry.',
                  codeSnippet: `import 'package:fpdart/fpdart.dart';
import '../logging/civora_logger.dart';
import 'failures.dart';

class ErrorHandler {
  static Failure handleException(dynamic exception) {
    CivoraLogger.error("System Exception Intercepted", error: exception);
    
    if (exception.toString().contains('permission-denied')) {
      return const ServerFailure("Access Denied: Missing or insufficient credentials");
    } else if (exception.toString().contains('network-request-failed')) {
      return const NetworkFailure("Local connection interrupted. Switching to offline queue...");
    } else if (exception.toString().contains('duplicate-detected')) {
      return const ServerFailure("A highly similar report already exists in this sector.");
    }
    
    return ServerFailure(exception.toString());
  }

  static Future<Either<Failure, T>> executeSafe<T>(Future<T> Function() action) async {
    try {
      final result = await action();
      return Right(result);
    } catch (e) {
      return Left(handleException(e));
    }
  }
}`
                }
              ]
            },
            {
              name: 'router',
              type: 'folder',
              description: 'Routing infrastructure powered by GoRouter, complete with role-based secure navigation guards.',
              children: [
                {
                  name: 'app_router.dart',
                  type: 'file',
                  description: 'Dynamic redirect logic based on Riverpod Auth state, keeping users strictly within authorized views.',
                  codeSnippet: `import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../logging/civora_logger.dart';

enum UserRole { guest, citizen, fieldEngineer, supervisor, higherAuthority }

class AuthStateNotifier extends StateNotifier<UserRole> {
  AuthStateNotifier() : super(UserRole.guest);
  void setRole(UserRole role) => state = role;
}

final authStateProvider = StateNotifierProvider<AuthStateNotifier, UserRole>((ref) => AuthStateNotifier());

final appRouterProivder = Provider<GoRouter>((ref) {
  final currentRole = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const Scaffold(body: Center(child: Text('Splash Portal'))),
      ),
      GoRoute(
        path: '/citizen/dashboard',
        builder: (context, state) => const Scaffold(body: Center(child: Text('Citizen Hub'))),
      ),
      GoRoute(
        path: '/authority/field-engineer',
        builder: (context, state) => const Scaffold(body: Center(child: Text('Engineer Worklist'))),
      ),
      GoRoute(
        path: '/authority/supervisor',
        builder: (context, state) => const Scaffold(body: Center(child: Text('Supervisor Auditing Panel'))),
      ),
      GoRoute(
        path: '/authority/higher',
        builder: (context, state) => const Scaffold(body: Center(child: Text('Command Center Analytics'))),
      ),
    ],
    redirect: (context, state) {
      CivoraLogger.info("Router Gate triggered. Guarding access for role: \$currentRole");
      final isGoingToDashboard = state.uri.toString().startsWith('/citizen') || state.uri.toString().startsWith('/authority');
      
      if (!isGoingToDashboard) {
        switch (currentRole) {
          case UserRole.citizen:
            return '/citizen/dashboard';
          case UserRole.fieldEngineer:
            return '/authority/field-engineer';
          case UserRole.supervisor:
            return '/authority/supervisor';
          case UserRole.higherAuthority:
            return '/authority/higher';
          default:
            return null;
        }
      }
      return null;
    },
  );
});`
                }
              ]
            },
            {
              name: 'theme',
              type: 'folder',
              description: 'Custom Material 3 dynamic color palettes, typography guidelines, and widget shape overrides.',
              children: [
                {
                  name: 'app_colors.dart',
                  type: 'file',
                  description: 'Defines modern high-contrast brand Emerald & Cyan values and dark slate backdrops.',
                  codeSnippet: `import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFF10B981); // Emerald Green
  static const Color secondary = Color(0xFF06B6D4); // Cyan Blue
  
  static const Color lightBg = Color(0xFFF9FAFB);
  static const Color lightSurface = Colors.white;
  static const Color lightTextPrimary = Color(0xFF111827);
  static const Color lightTextSecondary = Color(0xFF4B5563);
  static const Color lightBorder = Color(0xFFE5E7EB);

  static const Color darkBg = Color(0xFF0F172A); // Slate 900
  static const Color darkSurface = Color(0xFF1E293B); // Slate 800
  static const Color darkTextPrimary = Color(0xFFF9FAFB);
  static const Color darkTextSecondary = Color(0xFF9CA3AF);
  static const Color darkBorder = Color(0xFF334155);

  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color success = Color(0xFF10B981);
}`
                },
                {
                  name: 'civora_theme.dart',
                  type: 'file',
                  description: 'Generates Light and Dark ThemeData sets including customized Card and InputDecoration parameters.',
                  codeSnippet: `import 'package:flutter/material.dart';
import 'app_colors.dart';

class CivoraTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        background: AppColors.lightBg,
        surface: AppColors.lightSurface,
        error: AppColors.error,
      ),
      scaffoldBackgroundColor: AppColors.lightBg,
      cardTheme: CardTheme(
        color: AppColors.lightSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: AppColors.lightBorder, width: 1),
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.lightSurface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.lightBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.lightBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        background: AppColors.darkBg,
        surface: AppColors.darkSurface,
        error: AppColors.error,
      ),
      scaffoldBackgroundColor: AppColors.darkBg,
      cardTheme: CardTheme(
        color: AppColors.darkSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: AppColors.darkBorder, width: 1),
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkSurface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
      ),
    );
  }
}`
                }
              ]
            },
            {
              name: 'services',
              type: 'folder',
              description: 'Centralized database and synchronization layers managing persistent pipelines.',
              children: [
                {
                  name: 'firestore_service.dart',
                  type: 'file',
                  description: 'Facilitates robust spatial streams, write logs, and transactional queries across Firestore.',
                  codeSnippet: `import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../firebase/firebase_service.dart';
import '../logging/civora_logger.dart';

class FirestoreService {
  final FirebaseFirestore _db;

  FirestoreService(this._db);

  Future<void> setData({
    required String path,
    required Map<String, dynamic> data,
    bool merge = true,
  }) async {
    CivoraLogger.info("Queueing Firestore Write at: \$path");
    await _db.doc(path).set(data, SetOptions(merge: merge));
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> getGeohashSectorStream({
    required String collection,
    required String centerGeohash,
  }) {
    CivoraLogger.info("Constructing geohash queries at \$centerGeohash for \$collection");
    return _db
        .collection(collection)
        .where('location.geohash', isGreaterThanOrEqualTo: centerGeohash)
        .where('location.geohash', isLessThanOrEqualTo: '\$centerGeohash\\uf8ff')
        .snapshots();
  }
}

final firestoreServiceProvider = Provider<FirestoreService>((ref) {
  final firebase = ref.watch(firebaseServiceProvider);
  return FirestoreService(firebase.firestore);
});`
                },
                {
                  name: 'sync_service.dart',
                  type: 'file',
                  description: 'Monitors Firestore snapshotsInSync and coordinates data cache convergences.',
                  codeSnippet: `import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../logging/civora_logger.dart';

class SyncService {
  final FirebaseFirestore _db;
  StreamSubscription? _syncSubscription;

  SyncService(this._db);

  void startMonitoringSync() {
    CivoraLogger.info("Launching local cache synchronization monitor...");
    _syncSubscription = _db.snapshotsInSync().listen((_) {
      CivoraLogger.info("Offline local state matches cloud convergence. Synced successfully.");
    });
  }

  void dispose() {
    _syncSubscription?.cancel();
  }
}`
                }
              ]
            },
            {
              name: 'localization',
              type: 'folder',
              description: 'Multi-lingual translation catalogs supporting English, Spanish, and regional Indian languages.',
              children: [
                {
                  name: 'civora_localizations.dart',
                  type: 'file',
                  description: 'Translates functional strings dynamically based on Riverpod active locale.',
                  codeSnippet: `import 'package:flutter_riverpod/flutter_riverpod.dart';

class CivoraLocalizations {
  final String locale;
  CivoraLocalizations(this.locale);

  static final Map<String, Map<String, String>> _strings = {
    'en': {
      'report_issue': 'Report Civic Issue',
      'voice_complaint': 'Submit Voice Complaint',
      'status_submitted': 'Submitted',
      'status_duplicate': 'Duplicate Clustered',
      'assigned_to': 'Assigned to squad',
    },
    'es': {
      'report_issue': 'Reportar Problema Cívico',
      'voice_complaint': 'Enviar Queja de Voz',
      'status_submitted': 'Enviado',
      'status_duplicate': 'Duplicado Agrupado',
      'assigned_to': 'Asignado a escuadra',
    },
    'hi': {
      'report_issue': 'नागरिक समस्या दर्ज करें',
      'voice_complaint': 'आवाज शिकायत सबमिट करें',
      'status_submitted': 'दर्ज की गई',
      'status_duplicate': 'डुप्लिकेट क्लस्टर',
      'assigned_to': 'दस्ते को आवंटित',
    }
  };

  String translate(String key) {
    return _strings[locale]?[key] ?? _strings['en']?[key] ?? key;
  }
}

final localeProvider = StateProvider<String>((ref) => 'en');

final localizationsProvider = Provider<CivoraLocalizations>((ref) {
  final activeLocale = ref.watch(localeProvider);
  return CivoraLocalizations(activeLocale);
});`
                }
              ]
            },
            {
              name: 'widgets',
              type: 'folder',
              description: 'Highly customized, reusable design system widgets including buttons, text fields, loaders, and cards.',
              children: [
                {
                  name: 'civora_button.dart',
                  type: 'file',
                  description: 'Flexible elevated button with inline adaptive progress indicators.',
                  codeSnippet: `import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class CivoraButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final bool isLoading;

  const CivoraButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      width: double.infinity,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        onPressed: isLoading ? null : onPressed,
        child: isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
              )
            : Text(text, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
    );
  }
}`
                },
                {
                  name: 'civora_text_field.dart',
                  type: 'file',
                  description: 'Pre-styled typography paired input node.',
                  codeSnippet: `import 'package:flutter/material.dart';

class CivoraTextField extends StatelessWidget {
  final String label;
  final String hintText;
  final TextEditingController? controller;
  final bool isPassword;

  const CivoraTextField({
    super.key,
    required this.label,
    required this.hintText,
    this.controller,
    this.isPassword = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: isPassword,
          decoration: InputDecoration(
            hintText: hintText,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }
}`
                },
                {
                  name: 'civora_loading.dart',
                  type: 'file',
                  description: 'Standard brand loader with supportive telemetry metadata prompts.',
                  codeSnippet: `import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class CivoraLoading extends StatelessWidget {
  final String? message;
  const CivoraLoading({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(color: AppColors.primary),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(message!, style: const TextStyle(fontWeight: FontWeight.w500)),
          ]
        ],
      ),
    );
  }
}`
                }
              ]
            },
            {
              name: 'storage',
              type: 'folder',
              description: 'Contains abstracted storage contracts to defer concrete media uploads (e.g. Firebase Storage, Cloudinary) away from domain rules.',
              children: [
                {
                  name: 'media_storage_service.dart',
                  type: 'file',
                  description: 'Abstract contract that any storage provider must implement to upload voice complaints and pictures.',
                  codeSnippet: `import 'dart:io';

abstract class MediaStorageService {
  /// Uploads file to remote storage and returns the download URL.
  Future<String> uploadFile({
    required File file,
    required String path,
  });

  /// Deletes file from remote storage using its path or identifier.
  Future<void> deleteFile(String identifier);
}`
                }
              ]
            },
            {
              name: 'usecases',
              type: 'folder',
              description: 'The base usecase interface ensuring all interactors/controllers in the system adhere to the same execution signatures.',
              children: [
                {
                  name: 'usecase.dart',
                  type: 'file',
                  description: 'Base abstract contract with Type parameter and custom Params.',
                  codeSnippet: `import 'package:fpdart/fpdart.dart';
import '../error/failures.dart';

abstract class UseCase<Type, Params> {
  Future<Either<Failure, Type>> call(Params params);
}

class NoParams {}`
                }
              ]
            },
            {
              name: 'utils',
              type: 'folder',
              description: 'Provides utility handlers, including Geohash mathematical encoders, audio compression algorithms, and timestamp utilities.',
              children: [
                {
                  name: 'geohash_helper.dart',
                  type: 'file',
                  description: 'Performs precision configurable (default 7 chars) base32 geohash math, bounding box queries, and neighbor expansions.',
                  codeSnippet: `import 'package:geoflutterfire2/geoflutterfire2.dart';

class GeohashHelper {
  static final _geo = GeoFlutterFire();

  /// Encodes a lat/lng point into configurable length geohash string
  static String encode(double lat, double lng, {int precision = 7}) {
    final point = _geo.point(latitude: lat, longitude: lng);
    final fullHash = point.geohash;
    
    // Allow adaptive precision adjustments down or up based on config
    if (precision < fullHash.length) {
      return fullHash.substring(0, precision);
    }
    return fullHash;
  }

  /// Calculates neighboring cells for robust duplicate querying
  static List<String> getNeighbors(String geohash) {
    return _geo.neighborsOf(geohash: geohash);
  }
}`
                }
              ]
            }
          ]
        },
        {
          name: 'features',
          type: 'folder',
          description: 'Module-based feature sets containing self-contained directories. This prevents cross-feature coupling.',
          children: [
            {
              name: 'auth',
              type: 'folder',
              description: 'Manages user registration, identity verification, role assignment, and Split Collection security checks.',
              children: [
                {
                  name: 'domain',
                  type: 'folder',
                  description: 'The core business rule layer. Independent of Dart packages (Pure Dart). Defs Repository contracts and entities.',
                  children: [
                    {
                      name: 'entities',
                      type: 'folder',
                      description: 'Domain structures and enums such as UserEntity and UserRole.',
                      children: [
                        {
                          name: 'user_entity.dart',
                          type: 'file',
                          description: 'Model mapping verified split public/private fields with copyWith constructors.',
                          codeSnippet: `enum UserRole {
  citizen,
  fieldEngineer,
  supervisor,
  higherAuthority;

  String toJson() {
    switch (this) {
      case UserRole.citizen: return 'citizen';
      case UserRole.fieldEngineer: return 'field_engineer';
      case UserRole.supervisor: return 'supervisor';
      case UserRole.higherAuthority: return 'higher_authority';
    }
  }

  static UserRole fromJson(String value) {
    switch (value) {
      case 'field_engineer': return UserRole.fieldEngineer;
      case 'supervisor': return UserRole.supervisor;
      case 'higher_authority': return UserRole.higherAuthority;
      case 'citizen':
      default: return UserRole.citizen;
    }
  }

  String get displayName {
    switch (this) {
      case UserRole.citizen: return 'Citizen';
      case UserRole.fieldEngineer: return 'Field Engineer';
      case UserRole.supervisor: return 'Supervisor';
      case UserRole.higherAuthority: return 'Higher Authority';
    }
  }
}

class UserEntity {
  final String uid;
  final String displayName;
  final UserRole role;
  final String? photoUrl;
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
}`
                        }
                      ]
                    },
                    {
                      name: 'repositories',
                      type: 'folder',
                      description: 'Interfaces for database and identity engines.',
                      children: [
                        {
                          name: 'auth_repository.dart',
                          type: 'file',
                          description: 'Contract for signing in, registering profiles, logging out, and listening to streams.',
                          codeSnippet: `import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_entity.dart';

abstract class AuthRepository {
  Stream<UserEntity?> get authStateChanges;
  Future<Either<Failure, UserEntity>> signInWithGoogle();
  Future<Either<Failure, void>> signOut();
  Future<Either<Failure, UserEntity>> getCurrentUser();
}`
                        }
                      ]
                    },
                    {
                      name: 'usecases',
                      type: 'folder',
                      description: 'Pure command-driven operations.',
                      children: [
                        {
                          name: 'sign_in_with_google.dart',
                          type: 'file',
                          description: 'Bridges presentation requests to repository Google authentication.',
                          codeSnippet: `import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class SignInWithGoogle {
  final AuthRepository repository;
  const SignInWithGoogle(this.repository);

  Future<Either<Failure, UserEntity>> call() async {
    return await repository.signInWithGoogle();
  }
}`
                        }
                      ]
                    }
                  ]
                },
                {
                  name: 'data',
                  type: 'folder',
                  description: 'Data layer. Maps Firestore user documents, processes Google Sign-In popups, and handles local profile caching.',
                  children: [
                    {
                      name: 'models',
                      type: 'folder',
                      description: 'Data models with Firestore serialisation.',
                      children: [
                        {
                          name: 'user_model.dart',
                          type: 'file',
                          description: 'Extends UserEntity to parse split-profiles in Firestore.',
                          codeSnippet: `import '../../domain/entities/user_entity.dart';

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

  factory UserModel.fromFirestore({
    required String uid,
    required Map<String, dynamic> publicData,
    required Map<String, dynamic> privateData,
  }) {
    return UserModel(
      uid: uid,
      displayName: publicData['displayName'] ?? 'Anonymous Citizen',
      role: UserRole.fromJson(publicData['role'] ?? 'citizen'),
      photoUrl: publicData['photoUrl'],
      email: privateData['email'] ?? '',
      realName: privateData['realName'] ?? 'Anonymous',
      createdAt: DateTime.parse(privateData['createdAt']),
    );
  }
}`
                        }
                      ]
                    },
                    {
                      name: 'datasources',
                      type: 'folder',
                      description: 'Interact directly with FirebaseAuth and FirebaseFirestore.',
                      children: [
                        {
                          name: 'auth_remote_data_source.dart',
                          type: 'file',
                          description: 'Implements raw Firebase credential handshakes and split profile document creation.',
                          codeSnippet: `class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;

  Future<UserModel> _getOrCreateProfile(User firebaseUser) async {
    final publicRef = _firestore.collection('users').doc(uid);
    final privateRef = _firestore.collection('users').doc(uid).collection('private').doc('info');

    final batch = _firestore.batch();
    batch.set(publicRef, user.toPublicFirestore());
    batch.set(privateRef, user.toPrivateFirestore());
    await batch.commit();
  }
}`
                        }
                      ]
                    }
                  ]
                },
                {
                  name: 'presentation',
                  type: 'folder',
                  description: 'Presentation UI layer. Composed of Riverpod notifier providers, login screen widgets, and role router gates.',
                  children: [
                    {
                      name: 'providers',
                      type: 'folder',
                      description: 'Riverpod auth, user, and developer simulation providers.',
                      children: [
                        {
                          name: 'auth_providers.dart',
                          type: 'file',
                          description: 'Contains current authStateProviders and AuthNotifiers.',
                          codeSnippet: `final authStateChangesProvider = StreamProvider<UserEntity?>((ref) {
  final isDebugEnabled = ref.watch(devDebugEnabledProvider);
  if (isDebugEnabled) {
    return Stream.value(ref.watch(devMockUserProvider));
  }
  return ref.watch(authRepositoryProvider).authStateChanges;
});`
                        },
                        {
                          name: 'developer_debug_provider.dart',
                          type: 'file',
                          description: 'Strictly manages mock profile datasets in debug mode (kDebugMode).',
                          codeSnippet: `final devDebugEnabledProvider = StateProvider<bool>((ref) {
  if (!kDebugMode) return false;
  return false;
});`
                        }
                      ]
                    },
                    {
                      name: 'widgets',
                      type: 'folder',
                      description: 'Responsive M3 layouts and debug controllers.',
                      children: [
                        {
                          name: 'responsive_login_layout.dart',
                          type: 'file',
                          description: 'Flexible grid splitting for phones, tablets, and wide monitors.',
                          codeSnippet: `class ResponsiveLoginLayout extends StatelessWidget {
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 600;
    return isMobile ? _buildMobileLayout() : _buildTabletDesktopLayout();
  }
}`
                        },
                        {
                          name: 'developer_panel.dart',
                          type: 'file',
                          description: 'Hidden panel to swap simulation roles instantly.',
                          codeSnippet: `class DeveloperPanel extends ConsumerWidget {
  Widget build(BuildContext context, WidgetRef ref) {
    if (!kDebugMode) return const SizedBox.shrink();
    // Swapping between Citizen, Field Engineer, Supervisor, and Higher Authority roles...
  }
}`
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              name: 'issue_reporting',
              type: 'folder',
              description: 'Citizens reporting core module. Employs geohash-based clustering to automatically detect, prompt, and bundle duplicate filings.',
              children: [
                {
                  name: 'domain',
                  type: 'folder',
                  description: 'Core entities (Complaint, Geopoint, ImageAsset, AudioRecord) and business interactors (SubmitComplaint, VoteOnComplaint).',
                  children: [
                    {
                      name: 'entities',
                      type: 'folder',
                      description: 'Pure Dart representation of Civora civic issue models.'
                    },
                    {
                      name: 'usecases',
                      type: 'folder',
                      description: 'Interactive controller rules (CheckForDuplicates, SubmitVoiceComplaint).',
                      children: [
                        {
                          name: 'check_duplicates.dart',
                          type: 'file',
                          description: 'Core algorithm that triggers Firestore geohash checks and calls Gemini semantic matching.',
                          codeSnippet: `import 'package:fpdart/fpdart.dart';
import '../../core/error/failures.dart';
import '../../core/usecases/usecase.dart';
import '../entities/complaint.dart';
import '../repositories/issue_repository.dart';

class CheckDuplicates extends UseCase<List<Complaint>, CheckDuplicatesParams> {
  final IssueRepository repository;

  CheckDuplicates(this.repository);

  @override
  Future<Either<Failure, List<Complaint>>> call(CheckDuplicatesParams params) async {
    // Hybrid duplicate detection: Uses customizable geohash precision block,
    // combined with category comparisons, media hashes, and timestamp thresholds.
    return await repository.getDuplicateCandidates(
      lat: params.lat,
      lng: params.lng,
      category: params.category,
      geohashPrecision: params.precision,
    );
  }
}

class CheckDuplicatesParams {
  final double lat;
  final double lng;
  final String category;
  final int precision;

  CheckDuplicatesParams({
    required this.lat,
    required this.lng,
    required this.category,
    this.precision = 7, // Highly configurable default precision
  });
}`
                        }
                      ]
                    }
                  ]
                },
                {
                  name: 'data',
                  type: 'folder',
                  description: 'Fetches spatial grid data, maps models (ComplaintModel extends ComplaintEntity), and processes offline cache updates.',
                },
                {
                  name: 'presentation',
                  type: 'folder',
                  description: 'Renders the complaint form, interactive maps showing local duplicates, camera viewport overlay, and voice recorder amplitude curves.',
                }
              ]
            },
            {
              name: 'authority_workflow',
              type: 'folder',
              description: 'Role-based routing interfaces. Field Engineers see active tickets, Supervisors manage audits, and Higher Authorities receive macro dashboards.',
              children: [
                {
                  name: 'domain',
                  type: 'folder',
                  description: 'Validates status transition flows (Assigned -> InProgress -> Resolved) ensuring correct role authentication.',
                },
                {
                  name: 'data',
                  type: 'folder',
                  description: 'Updates ticketing categories, processes verification images, and sends targeted FCM notifications.',
                },
                {
                  name: 'presentation',
                  type: 'folder',
                  description: 'Renders personalized tasks feeds, maps with optimized field worker routes, and signature upload panels.',
                }
              ]
            },
            {
              name: 'ai_assistant',
              type: 'folder',
              description: 'Empowers citizens to converse with Civora AI to query bylaws, draft reports, and automatically verify municipal procedures.',
            }
          ]
        }
      ]
    },
    {
      name: 'pubspec.yaml',
      type: 'file',
      description: 'Flutter dependency manifest. Contains essential libraries for Spatial querying, Firebase integration, Riverpod state management, and media recording.',
      codeSnippet: `name: civora_app
description: Shaping the Next Era of Civic Intelligence.
version: 1.0.0+1

environment:
  sdk: '>=3.3.0 <4.0.0'
  flutter: '>=3.19.0'

dependencies:
  flutter:
    sdk: flutter

  # Firebase Suite
  firebase_core: ^2.27.0
  firebase_auth: ^4.17.8
  cloud_firestore: ^4.15.8
  firebase_messaging: ^14.7.19

  # Google API & Location Maps
  google_sign_in: ^6.2.1
  google_maps_flutter: ^2.5.3
  geolocator: ^11.0.0
  geoflutterfire2: ^2.3.15 # Geohash based spatial indexing

  # Google Gemini AI SDK
  google_generative_ai: ^0.2.2 # Flutter Official Gemini API client

  # State Management & Functional Helpers
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.3
  fpdart: ^1.1.0 # Pure functional programming instead of dartz
  equatable: ^2.0.5

  # Utility & Animation
  record: ^5.0.4 # Voice compliant recorders
  uuid: ^4.3.3
  path_provider: ^2.1.2
  motion: ^0.1.2
  cached_network_image: ^3.3.1
  lucide_icons: ^0.300.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  riverpod_generator: ^2.3.9
  mocktail: ^1.0.3`
    }
  ]
};

export const firestoreCollections: FirestoreCollection[] = [
  {
    name: 'Users (Public Profiles)',
    path: '/users/{userId}',
    description: 'Public-facing directory of citizens and city authorities. Designed for rapid joins/views in feeds and logs without exposing PII.',
    fields: [
      { name: 'displayName', type: 'String', description: 'Citizen handle or authority name (immutable after registration)' },
      { name: 'photoUrl', type: 'String', description: 'URL pointing to the user avatar image' },
      { name: 'role', type: 'String (Enum)', description: 'citizen | field_engineer | supervisor | higher_authority (Write strictly guarded)' },
      { name: 'gamification', type: 'Map', description: 'Grouped player metrics: { xp: Integer, badge: String, level: Integer, impactScore: Integer }' },
      { name: 'createdAt', type: 'Timestamp', description: 'Account creation time (immutable)' },
      { name: 'updatedAt', type: 'Timestamp', description: 'Last active profile edit' }
    ],
    securityRulesSummary: 'Publicly readable by any authenticated user. Write allowed only for the matching userId document. Role modification restricted via server-side admin claims or strict rules.'
  },
  {
    name: 'Users (Private Info - ABAC Split)',
    path: '/users/{userId}/private/info',
    description: 'Split Collection containing Personally Identifiable Information (PII). Isolated to guarantee privacy, prevent identity scraping, and ensure compliance.',
    fields: [
      { name: 'email', type: 'String', description: 'Verified Google Auth email address (immutable)' },
      { name: 'realName', type: 'String', description: 'Legal name of the citizen/authority for compliance audits (immutable)' },
      { name: 'phoneNumber', type: 'String', description: 'Contact phone for critical civic hazard alerts' },
      { name: 'fcmToken', type: 'String', description: 'Firebase Cloud Messaging device token for push notifications' },
      { name: 'preferredLanguage', type: 'String', description: 'Language code (e.g. "en", "es", "hi") used for localization' },
      { name: 'lastSyncedAt', type: 'Timestamp', description: 'Tracks local offline state sync convergence timestamps' }
    ],
    securityRulesSummary: 'Strict private access. Only the owning user (`request.auth.uid == userId`) can read or write. Blocked from global listings or wildcard queries.'
  },
  {
    name: 'Complaints (Core Issues)',
    path: '/complaints/{complaintId}',
    description: 'The master spatial and categorical database of civic issues. Centered around geospatial indexing and adaptive geohashing to minimize duplicate complaints.',
    fields: [
      { name: 'title', type: 'String', description: 'Factual title, dynamically standardized by Gemini intake pipeline' },
      { name: 'description', type: 'String', description: 'Raw issue description recorded by the citizen reporter' },
      { name: 'reporterId', type: 'String', description: 'UID of reporting citizen (immutable)' },
      { name: 'category', type: 'String (Enum)', description: 'roads | water | sanitation | lighting | safety (Assigned by AI, modifiable by supervisors)' },
      { name: 'location', type: 'Map', description: 'Structured spatial node: { latitude: Number, longitude: Number, geohash: String (default 7 chars), accuracy: Number, locality: String, ward: String, district: String, state: String }' },
      { name: 'severityScore', type: 'Integer (0-100)', description: 'AI-calculated numerical gravity index used to prioritize dispatch' },
      { name: 'priority', type: 'String (Enum)', description: 'low | medium | high | critical (Derived on UI or assigned dynamically via AI)' },
      { name: 'status', type: 'String (Enum)', description: 'submitted | under_review | assigned | in_progress | resolved | awaiting_community_confirmation | closed | reopened | duplicate' },
      { name: 'parentDuplicateId', type: 'String (Nullable)', description: 'If marked as duplicate, points to the original root Complaint ID. Null otherwise.' },
      { name: 'duplicateConfidence', type: 'Integer (0-100)', description: 'Certainty metric computed by the duplicate detection engine' },
      { name: 'duplicateReason', type: 'String (Nullable)', description: 'Explanation detailing matching coordinates, image cues, or semantic similarities' },
      { name: 'duplicateMethod', type: 'String (Enum)', description: 'ai | geohash | manual' },
      { name: 'assignment', type: 'Map', description: 'Officer dispatch parameters: { engineerId: String, supervisorId: String, assignedBy: String, assignedAt: Timestamp }' },
      { name: 'votesCount', type: 'Integer', description: 'Denormalized upvotes sum to avoid expensive read aggregation joins' },
      { name: 'media', type: 'Array of Maps', description: 'Polymorphic multi-media payload: [ { type: "image" | "voice" | "video", relativePath: String, url: String, durationSec: Number, width: Number, height: Number, checkHash: String } ]' },
      { name: 'latestAnalysisId', type: 'String', description: 'ID of the active intelligence payload in the ai_analysis subcollection' },
      { name: 'lifecycleTimeline', type: 'Map', description: 'SLA auditing checklist: { reportedAt: Timestamp, assignedAt: Timestamp, resolvedAt: Timestamp, verifiedAt: Timestamp, closedAt: Timestamp }' },
      { name: 'createdAt', type: 'Timestamp', description: 'Time filed (immutable)' },
      { name: 'updatedAt', type: 'Timestamp', description: 'Last active status transition or field worker edit' }
    ],
    securityRulesSummary: 'Read: Any authenticated user can read or query (using geohash filters). Create: Requires valid reporterId matching auth.uid. Update: State transitions restricted to assigned engineers and supervisors.'
  },
  {
    name: 'Votes (Subcollection)',
    path: '/complaints/{complaintId}/votes/{userId}',
    description: 'Subcollection for tracking unique endorsements. Prevents double-voting while maintaining a flat, cost-efficient read path.',
    fields: [
      { name: 'votedAt', type: 'Timestamp', description: 'Timestamp of vote submission (immutable)' },
      { name: 'isUpvote', type: 'Boolean', description: 'True for endorsement, false for withdrawal' }
    ],
    securityRulesSummary: 'Read: Authenticated users can read. Write: Only the document owner (`request.auth.uid == userId`) can write. Upvote increment triggers a Firestore Transaction/Cloud Function to update parent votesCount.'
  },
  {
    name: 'AI Analysis & Insights (Subcollection)',
    path: '/complaints/{complaintId}/ai_analysis/{analysisId}',
    description: 'Houses versioned JSON outputs from Gemini agents. Keeps historical telemetry preserved for trend tracking and pipeline debugging.',
    fields: [
      { name: 'intakeSummary', type: 'String', description: 'Gemini-generated standard technical description of the hazard' },
      { name: 'imageConfidence', type: 'Number', description: 'Visual semantic model verification score (0.0 to 1.0)' },
      { name: 'categorizationAccuracy', type: 'Number', description: 'Confidence score of the department router' },
      { name: 'suggestedPriority', type: 'String', description: 'AI priority level assessment (low | medium | high)' },
      { name: 'routingDepartment', type: 'String', description: 'Municipal division key matching the issue category' },
      { name: 'hotspotInferenceId', type: 'String (Nullable)', description: 'Associated trend prediction identifier' },
      { name: 'verifiedAt', type: 'Timestamp', description: 'Timestamp of AI validation run' }
    ],
    securityRulesSummary: 'Read: Authenticated citizens and authorities can read. Write: Strictly restricted. Only municipal backend servers and authorized cloud function service accounts can write.'
  },
  {
    name: 'Activity Logs & Audits (Subcollection)',
    path: '/complaints/{complaintId}/logs/{logId}',
    description: 'Immutable historical audit trail documenting every status transition, citizen upvote fuse, and field engineer sign-off.',
    fields: [
      { name: 'actorId', type: 'String', description: 'UID of user making modification (immutable)' },
      { name: 'actorName', type: 'String', description: 'Cached display name of the actor to avoid massive join reads' },
      { name: 'actorRole', type: 'String', description: 'citizen | field_engineer | supervisor | higher_authority (immutable)' },
      { name: 'previousStatus', type: 'String', description: 'Workflow state prior to transition' },
      { name: 'newStatus', type: 'String', description: 'Newly committed workflow state' },
      { name: 'notes', type: 'String', description: 'Field engineer resolution report or citizen reopening feedback' },
      { name: 'evidenceUrl', type: 'String (Nullable)', description: 'URL of photo proof confirming the hazard repair' },
      { name: 'createdAt', type: 'Timestamp', description: 'Audit log write timestamp (immutable)' }
    ],
    securityRulesSummary: 'Read: Any authenticated user can list logs. Write: Read-only once written. Creating log entries restricted to assigned field workers, supervisors, and core system agents.'
  },
  {
    name: 'Notifications (User-Centric Subcollection)',
    path: '/users/{userId}/notifications/{notificationId}',
    description: 'Scalable system notification queue. Placing them inside the user document paths ensures secure indices, prevents cross-talk, and lowers query bills.',
    fields: [
      { name: 'title', type: 'String', description: 'Alert headline text' },
      { name: 'body', type: 'String', description: 'Detailed notification body' },
      { name: 'type', type: 'String', description: 'status_update | reward_earned | duplicate_fused | dispatch' },
      { name: 'isRead', type: 'Boolean', description: 'Read receipt state' },
      { name: 'relatedComplaintId', type: 'String (Nullable)', description: 'Associated complaint ID for quick tap-routing' },
      { name: 'createdAt', type: 'Timestamp', description: 'Alert creation date (immutable)' }
    ],
    securityRulesSummary: 'Read & Write: Only accessible by the parent user (`request.auth.uid == userId`). System-level administrative service write is enabled.'
  },
  {
    name: 'Analytics Aggregates (Pre-computed)',
    path: '/analytics_aggregates/{metricId}',
    description: 'Pre-computed high-speed dashboard telemetry (e.g. daily, monthly, category-wise, or city-wide totals) to eliminate real-time aggregation queries and save Firestore costs.',
    fields: [
      { name: 'totalComplaintsCount', type: 'Integer', description: 'Grand total of complaints submitted' },
      { name: 'resolvedCount', type: 'Integer', description: 'Total resolved and verified complaints' },
      { name: 'duplicateCount', type: 'Integer', description: 'Total complaints successfully fused and clustered' },
      { name: 'categoryBreakdown', type: 'Map', description: 'Key-value map of category counts (e.g. { "roads": 142, "water": 89 })' },
      { name: 'averageResolutionTimeMs', type: 'Number', description: 'Pre-calculated municipal SLA compliance speed metric' },
      { name: 'lastUpdatedAt', type: 'Timestamp', description: 'Timestamp of last statistical update batch' }
    ],
    securityRulesSummary: 'Read: Publicly readable by all authenticated users (drives the Impact Dashboard). Write: Write allowed only for municipal backend workers and Cloud Scheduler task runners.'
  },
  {
    name: 'Hotspot Predictions (Spatial Intelligence)',
    path: '/hotspot_predictions/{predictionId}',
    description: 'Houses predictive spatial models generated by AI trends analysis to preempt municipal breakdowns.',
    fields: [
      { name: 'geohashSector', type: 'String', description: 'A 5-digit geohash sector representing approximately a 4.9km × 4.9km grid zone' },
      { name: 'densityScore', type: 'Number', description: 'Normalized cluster volume intensity (0.0 to 100.0)' },
      { name: 'growthRate', type: 'Number', description: 'Percentage change in reported issues week-over-week' },
      { name: 'predictedCategory', type: 'String', description: 'Highest probability upcoming breakdown type' },
      { name: 'recommendedPreemptiveAction', type: 'String', description: 'Suggested civic intervention drafted by Gemini' },
      { name: 'generatedAt', type: 'Timestamp', description: 'Model generation timestamp' }
    ],
    securityRulesSummary: 'Read: Accessible by authorities and supervisors to plan resources. Write: Read-only. Strictly restricted to server-side AI model training pipelines.'
  }
];

export const geminiPipelines: AIPipeline[] = [
  {
    name: 'AI Complaint Intake (Voice-to-JSON)',
    model: 'gemini-3.5-flash',
    description: 'Processes speech recordings of citizen complaints. Automatically generates short, standardized summaries and extracts critical keywords.',
    systemInstruction: 'Analyze the voice transcription of a citizen report. Standardize the phrasing into a high-quality civic report title, descriptive summary, and exact category matching of local issues.',
    responseSchema: `{
  "title": "Short descriptive title of the issue",
  "summary": "Polished, factual description without colloquial speech patterns",
  "category": "road_damage | sanitation | water_leak | public_safety | lighting",
  "estimatedSeverity": "high | medium | low"
}`
  },
  {
    name: 'AI Image Understanding & Duplicate Detection Agent',
    model: 'gemini-2.5-flash-image',
    description: 'Validates uploaded complaint photos. Automatically checks image contents (e.g., confirming a pothole is actually a pothole, and not an unrelated photo) and compares them with neighboring complaints to identify duplicates.',
    systemInstruction: 'Analyze the image and text prompt. Identify if the photograph contains the reported civic damage. Perform a visual semantic review against neighboring complaints description to flag visual duplicates.'
  },
  {
    name: 'AI Priority & Smart Department Router',
    model: 'gemini-3.5-flash',
    description: 'Parses descriptions, metadata (GPS location, school boundaries, high-traffic arterial grids), and image summary to prioritize resolution urgency and route the ticket to the respective field squad.',
    systemInstruction: 'Act as the master municipal routing engine. Evaluate incoming reports based on risk to human life, public safety disruption, environmental damage, and infrastructure scale. Assign priority level and route to the correct engineering division.'
  },
  {
    name: 'AI Closure Verification',
    model: 'gemini-2.5-flash-image',
    description: 'Instantly auditing field engineer completion photos. Compares the original damage photo with the newly uploaded resolution proof to guarantee authentic municipal restorations.',
    systemInstruction: 'Analyze two images: (1) original damage report and (2) completion proof. Assess whether the civic hazard has been successfully repaired, cleaned, or replaced. Return verification confidence.'
  },
  {
    name: 'AI Spatial Hotspot & Predictive Trend Agent',
    model: 'gemini-3.5-flash',
    description: 'Processes spatial-temporal aggregates, geohash cluster logs, historical weather conditions, and demographic overlays. Automatically generates localized risk models, growth trajectories, preventive recommendations, and citizen-safe explanations.',
    systemInstruction: 'Analyze municipal geohash cluster densities, week-over-week trends, and historical reports. Forecast high-probability upcoming infrastructural failures. Generate preventive maintenance recommendations for authorities, and distinct, jargon-free explanations for the public.',
    responseSchema: `{
  "predictedCategory": "roads | water | sanitation | lighting | safety",
  "riskLevel": "green | yellow | orange | red",
  "growthRate": "Percentage growth forecast, e.g. +34%",
  "confidenceScore": "Confidence level percentage, e.g. 92%",
  "citizenExplanation": "Actionable, informational, and simple explanation of why this area is flagged without revealing municipal routing or internal assignments.",
  "preventiveRecommendations": "Specific operational steps for field engineers to preemptively mitigate the hazard.",
  "resourcePlanningInsights": "Dispatch details, supervisor requirements, and target resolution time frames."
}`
  }
];

