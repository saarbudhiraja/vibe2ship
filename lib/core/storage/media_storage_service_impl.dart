import 'dart:io';
import 'media_storage_service.dart';

class MockMediaStorageService implements MediaStorageService {
  @override
  Future<String> uploadFile({
    required File file,
    required String path,
  }) async {
    // Return a simulated cloud storage URL
    await Future.delayed(const Duration(milliseconds: 600));
    final filename = file.path.split('/').last;
    return 'https://firebasestorage.googleapis.com/v0/b/civora-unified/o/${Uri.encodeComponent(path)}%2F$filename?alt=media';
  }

  @override
  Future<void> deleteFile(String identifier) async {
    await Future.delayed(const Duration(milliseconds: 200));
  }
}
