import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase using current platform options
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(
    // ProviderScope is mandatory to unlock Riverpod state management & DI
    const ProviderScope(
      child: CivoraApp(),
    ),
  );
}

class CivoraApp extends ConsumerWidget {
  const CivoraApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch GoRouter provider to receive dynamic role-based redirection streams
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'Civora',
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      
      // Modern slate/emerald Material 3 theme configuration matching our design philosophy
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF10B981), // Modern Emerald accent
          brightness: Brightness.dark,
          primary: const Color(0xFF10B981),
          secondary: const Color(0xFF3B82F6), // Professional Indigo/Blue
          background: const Color(0xFF070B19), // Deep rich charcoal/slate background
          surface: const Color(0xFF0F172A),
          surfaceVariant: const Color(0xFF1E293B),
          error: const Color(0xFFEF4444),
        ),
        scaffoldBackgroundColor: const Color(0xFF070B19),
        cardTheme: const CardTheme(
          color: Color(0xFF0F172A),
          elevation: 2,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF10B981),
            foregroundColor: Colors.black,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        textTheme: const TextTheme(
          displayLarge: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.bold),
          titleLarge: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.bold),
          bodyMedium: TextStyle(fontFamily: 'Inter'),
          labelLarge: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11),
        ),
      ),
    );
  }
}
