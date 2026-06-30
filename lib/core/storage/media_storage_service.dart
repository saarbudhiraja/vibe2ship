import 'dart:io';

abstract class MediaStorageService {
  /// Uploads file to remote storage and returns the download URL.
  Future<String> uploadFile({
    required File file,
    required String path,
  });

  /// Deletes file from remote storage using its path or identifier.
  Future<void> deleteFile(String identifier);
}
