import 'dart:io';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/storage/media_storage_service.dart';
import '../../domain/entities/complaint.dart';
import '../../domain/repositories/issue_repository.dart';
import '../datasources/complaints_local_data_source.dart';
import '../datasources/complaints_remote_data_source.dart';
import '../models/complaint_model.dart';

class IssueRepositoryImpl implements IssueRepository {
  final ComplaintsRemoteDataSource remoteDataSource;
  final ComplaintsLocalDataSource localDataSource;
  final MediaStorageService mediaStorageService;
  final bool isOnlineSimulation; // Set by network stream

  IssueRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
    required this.mediaStorageService,
    this.isOnlineSimulation = true,
  });

  @override
  Future<Either<Failure, List<Complaint>>> getDuplicateCandidates({
    required double lat,
    required double lng,
    required String category,
    int geohashPrecision = 7,
  }) async {
    try {
      if (!isOnlineSimulation) {
        // Return CacheFailure or empty candidate list for offline matching
        return const Right([]);
      }
      final models = await remoteDataSource.getDuplicateCandidates(
        lat: lat,
        lng: lng,
        category: category,
        geohashPrecision: geohashPrecision,
      );
      return Right(models);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Complaint>> submitComplaint(Complaint complaint) async {
    try {
      final model = ComplaintModel.fromEntity(complaint);
      if (!isOnlineSimulation) {
        // Safe Queue offline saving
        await localDataSource.cachePendingComplaint(model);
        return Left(NetworkFailure("Offline queue enabled. Saved report to local queue."));
      }
      final result = await remoteDataSource.submitComplaint(model);
      return Right(result);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Unit>> syncOfflineComplaints() async {
    try {
      if (!isOnlineSimulation) {
        return const Left(NetworkFailure("Cannot sync while offline."));
      }
      final pending = await localDataSource.getCachedPendingComplaints();
      for (var complaint in pending) {
        // 1. Upload media files first (idempotent, skip those already uploaded)
        final updatedMediaList = <ComplaintMedia>[];
        for (var media in complaint.media) {
          if (media.url.startsWith('file://')) {
            final filePath = media.url.replaceFirst('file://', '');
            final file = File(filePath);
            if (await file.exists()) {
              // Upload through approved MediaStorageService
              final remoteUrl = await mediaStorageService.uploadFile(
                file: file,
                path: 'complaints/${complaint.id}',
              );
              updatedMediaList.add(ComplaintMedia(
                type: media.type,
                relativePath: media.relativePath,
                url: remoteUrl,
                durationSec: media.durationSec,
                width: media.width,
                height: media.height,
                checkHash: media.checkHash,
              ));
            } else {
              // Fallback if local file was cleared/missing during simulation
              updatedMediaList.add(media);
            }
          } else {
            // Already uploaded (remote URL starts with http) - skip re-uploading
            updatedMediaList.add(media);
          }
        }

        // Create updated complaint model with newly resolved remote URLs
        final updatedComplaint = ComplaintModel(
          id: complaint.id,
          title: complaint.title,
          description: complaint.description,
          reporterId: complaint.reporterId,
          category: complaint.category,
          location: complaint.location,
          severityScore: complaint.severityScore,
          priority: complaint.priority,
          status: complaint.status,
          parentDuplicateId: complaint.parentDuplicateId,
          media: updatedMediaList,
          latestAnalysisId: complaint.latestAnalysisId,
          lifecycleTimeline: complaint.lifecycleTimeline,
          createdAt: complaint.createdAt,
          updatedAt: complaint.updatedAt,
        );

        // 2. Perform Firestore write using the approved workflow
        await remoteDataSource.submitComplaint(updatedComplaint);
        
        // 3. Clear from local cache only after successful Firestore transaction
        await localDataSource.clearPendingComplaint(complaint.id);
      }
      return const Right(unit);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, int>> getPendingOfflineCount() async {
    try {
      final pending = await localDataSource.getCachedPendingComplaints();
      return Right(pending.length);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }

  @override
  Stream<Either<Failure, List<Complaint>>> streamUserComplaints(String userId) {
    return remoteDataSource.streamUserComplaints(userId).map<Either<Failure, List<Complaint>>>((list) {
      return Right(list);
    }).handleError((e) {
      return Left(ServerFailure(e.toString()));
    });
  }

  @override
  Stream<Either<Failure, List<Complaint>>> streamAllComplaints() {
    return remoteDataSource.streamAllComplaints().map<Either<Failure, List<Complaint>>>((list) {
      return Right(list);
    }).handleError((e) {
      return Left(ServerFailure(e.toString()));
    });
  }

  @override
  Stream<Either<Failure, Complaint>> streamComplaintById(String id) {
    return remoteDataSource.streamComplaintById(id).map<Either<Failure, Complaint>>((complaint) {
      return Right(complaint);
    }).handleError((e) {
      return Left(ServerFailure(e.toString()));
    });
  }

  @override
  Future<Either<Failure, Complaint>> updateComplaint(Complaint complaint) async {
    try {
      final model = ComplaintModel.fromEntity(complaint);
      if (isOnlineSimulation) {
        final updated = await remoteDataSource.updateComplaint(model);
        return Right(updated);
      } else {
        await localDataSource.cachePendingComplaint(model);
        return Left(ServerFailure('Offline queue: Complaint updated locally and cached.'));
      }
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Complaint>> reopenComplaint({
    required String id,
    required String reason,
  }) async {
    try {
      final existing = await remoteDataSource.getComplaintById(id);
      
      final updated = ComplaintModel(
        id: existing.id,
        title: existing.title,
        description: "${existing.description}\n\n[Reopened reason]: $reason",
        reporterId: existing.reporterId,
        category: existing.category,
        location: existing.location,
        severityScore: existing.severityScore,
        priority: existing.priority,
        status: ComplaintStatus.reopened,
        parentDuplicateId: existing.parentDuplicateId,
        media: existing.media,
        latestAnalysisId: existing.latestAnalysisId,
        lifecycleTimeline: ComplaintTimeline(
          reportedAt: existing.lifecycleTimeline.reportedAt,
          assignedAt: existing.lifecycleTimeline.assignedAt,
          resolvedAt: existing.lifecycleTimeline.resolvedAt,
          verifiedAt: existing.lifecycleTimeline.verifiedAt,
          closedAt: null, // cleared
        ),
        createdAt: existing.createdAt,
        updatedAt: DateTime.now(),
      );

      final result = await remoteDataSource.updateComplaint(updated);
      return Right(result);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Complaint>> editComplaint({
    required String id,
    required String title,
    required String description,
  }) async {
    try {
      final existing = await remoteDataSource.getComplaintById(id);
      
      // Permit edit only if in editable states: submitted, underReview, reopened
      final isPermitted = existing.status == ComplaintStatus.submitted ||
          existing.status == ComplaintStatus.underReview ||
          existing.status == ComplaintStatus.reopened;

      if (!isPermitted) {
        return const Left(ValidationFailure("Complaints can only be edited while under review or submitted."));
      }

      final updated = ComplaintModel(
        id: existing.id,
        title: title,
        description: description,
        reporterId: existing.reporterId,
        category: existing.category,
        location: existing.location,
        severityScore: existing.severityScore,
        priority: existing.priority,
        status: existing.status,
        parentDuplicateId: existing.parentDuplicateId,
        media: existing.media,
        latestAnalysisId: existing.latestAnalysisId,
        lifecycleTimeline: existing.lifecycleTimeline,
        createdAt: existing.createdAt,
        updatedAt: DateTime.now(),
      );

      final result = await remoteDataSource.updateComplaint(updated);
      return Right(result);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Complaint>> upvoteDuplicate({
    required String id,
    required String userId,
  }) async {
    try {
      final existing = await remoteDataSource.getComplaintById(id);
      
      // Upvoting increments severity score up to 100 as proxy of community interest
      final nextSeverity = (existing.severityScore + 5).clamp(0, 100);
      
      final updated = ComplaintModel(
        id: existing.id,
        title: existing.title,
        description: existing.description,
        reporterId: existing.reporterId,
        category: existing.category,
        location: existing.location,
        severityScore: nextSeverity,
        priority: nextSeverity > 80 ? ComplaintPriority.critical : existing.priority,
        status: existing.status,
        parentDuplicateId: existing.parentDuplicateId,
        media: existing.media,
        latestAnalysisId: existing.latestAnalysisId,
        lifecycleTimeline: existing.lifecycleTimeline,
        createdAt: existing.createdAt,
        updatedAt: DateTime.now(),
      );

      final result = await remoteDataSource.updateComplaint(updated);
      return Right(result);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Complaint>> confirmClosure({
    required String id,
    required String userId,
    required bool satisfied,
    String? feedback,
  }) async {
    try {
      final existing = await remoteDataSource.getComplaintById(id);
      
      final nextStatus = satisfied ? ComplaintStatus.closed : ComplaintStatus.reopened;
      final finalDesc = feedback != null && feedback.isNotEmpty
          ? "${existing.description}\n\n[Community feedback]: $feedback"
          : existing.description;

      final updated = ComplaintModel(
        id: existing.id,
        title: existing.title,
        description: finalDesc,
        reporterId: existing.reporterId,
        category: existing.category,
        location: existing.location,
        severityScore: existing.severityScore,
        priority: existing.priority,
        status: nextStatus,
        parentDuplicateId: existing.parentDuplicateId,
        media: existing.media,
        latestAnalysisId: existing.latestAnalysisId,
        lifecycleTimeline: ComplaintTimeline(
          reportedAt: existing.lifecycleTimeline.reportedAt,
          assignedAt: existing.lifecycleTimeline.assignedAt,
          resolvedAt: existing.lifecycleTimeline.resolvedAt,
          verifiedAt: DateTime.now(),
          closedAt: satisfied ? DateTime.now() : null,
        ),
        createdAt: existing.createdAt,
        updatedAt: DateTime.now(),
      );

      final result = await remoteDataSource.updateComplaint(updated);
      return Right(result);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
