import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/complaint.dart';

abstract class IssueRepository {
  /// Fetches local duplicate candidates based on geohash grid and category
  Future<Either<Failure, List<Complaint>>> getDuplicateCandidates({
    required double lat,
    required double lng,
    required String category,
    int precision = 7,
  });

  /// Submits a new citizen complaint into the persistent architecture (or queues offline)
  Future<Either<Failure, Complaint>> submitComplaint(Complaint complaint);

  /// Synchronizes any pending offline complaints with Firestore
  Future<Either<Failure, Unit>> syncOfflineComplaints();

  /// Gets the count of pending offline complaints
  Future<Either<Failure, int>> getPendingOfflineCount();

  /// Streams the complaints filed by a specific user for real-time tracking
  Stream<Either<Failure, List<Complaint>>> streamUserComplaints(String userId);

  /// Streams all complaints for community endorsement and feed
  Stream<Either<Failure, List<Complaint>>> streamAllComplaints();

  /// Streams a single complaint's details for real-time tracking on details screen
  Stream<Either<Failure, Complaint>> streamComplaintById(String id);

  /// Reopens a resolved or closed complaint
  Future<Either<Failure, Complaint>> reopenComplaint({
    required String id,
    required String reason,
  });

  /// Edits an existing complaint (only in permitted initial states like submitted)
  Future<Either<Failure, Complaint>> editComplaint({
    required String id,
    required String title,
    required String description,
  });

  /// Endorse / Upvote a duplicate complaint instead of submitting a new duplicate
  Future<Either<Failure, Complaint>> upvoteDuplicate({
    required String id,
    required String userId,
  });

  /// Submit Community Confirmation for a resolved complaint to transition to closed or reopened
  Future<Either<Failure, Complaint>> confirmClosure({
    required String id,
    required String userId,
    required bool satisfied,
    String? feedback,
  });

  /// Updates an entire complaint (used by authority role transitions and status syncs)
  Future<Either<Failure, Complaint>> updateComplaint(Complaint complaint);
}
