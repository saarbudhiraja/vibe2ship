import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/storage/media_storage_service.dart';
import '../../../../core/storage/media_storage_service_impl.dart';
import '../../data/datasources/complaints_local_data_source.dart';
import '../../data/datasources/complaints_remote_data_source.dart';
import '../../data/repositories/issue_repository_impl.dart';
import '../../domain/entities/complaint.dart';
import '../../domain/repositories/issue_repository.dart';
import '../../domain/usecases/check_duplicates.dart';
import '../../domain/usecases/submit_complaint.dart';

// Firestore dependency provider
final firestoreProvider = Provider<FirebaseFirestore>((ref) => FirebaseFirestore.instance);

// Media Storage Provider
final mediaStorageServiceProvider = Provider<MediaStorageService>((ref) {
  return MockMediaStorageService();
});

// Data source providers
final complaintsRemoteDataSourceProvider = Provider<ComplaintsRemoteDataSource>((ref) {
  final firestore = ref.watch(firestoreProvider);
  return ComplaintsRemoteDataSourceImpl(firestore);
});

final complaintsLocalDataSourceProvider = Provider<ComplaintsLocalDataSource>((ref) {
  return ComplaintsLocalDataSourceImpl();
});

// Connectivity Simulator Provider (True = Online, False = Offline)
final connectivityProvider = StateProvider<bool>((ref) => true);

// Repository Provider
final issueRepositoryProvider = Provider<IssueRepository>((ref) {
  final remote = ref.watch(complaintsRemoteDataSourceProvider);
  final local = ref.watch(complaintsLocalDataSourceProvider);
  final mediaStorage = ref.watch(mediaStorageServiceProvider);
  final isOnline = ref.watch(connectivityProvider);
  return IssueRepositoryImpl(
    remoteDataSource: remote,
    localDataSource: local,
    mediaStorageService: mediaStorage,
    isOnlineSimulation: isOnline,
  );
});

// Usecase Providers
final submitComplaintUseCaseProvider = Provider<SubmitComplaint>((ref) {
  final repo = ref.watch(issueRepositoryProvider);
  return SubmitComplaint(repo);
});

final checkDuplicatesUseCaseProvider = Provider<CheckDuplicates>((ref) {
  final repo = ref.watch(issueRepositoryProvider);
  return CheckDuplicates(repo);
});

// Offline queue counter state provider
final offlineQueueCountProvider = StateProvider<int>((ref) => 0);

// Submission State notifier
enum ComplaintSubmitStatus { idle, submitting, success, offlineQueued, failure }

class ComplaintSubmitState {
  final ComplaintSubmitStatus status;
  final String? errorMessage;
  final double uploadProgress; // 0.0 to 1.0

  const ComplaintSubmitState({
    required this.status,
    this.errorMessage,
    this.uploadProgress = 0.0,
  });

  ComplaintSubmitState copyWith({
    ComplaintSubmitStatus? status,
    String? errorMessage,
    double? uploadProgress,
  }) {
    return ComplaintSubmitState(
      status: status ?? this.status,
      errorMessage: errorMessage ?? this.errorMessage,
      uploadProgress: uploadProgress ?? this.uploadProgress,
    );
  }
}

class ComplaintSubmitNotifier extends StateNotifier<ComplaintSubmitState> {
  final SubmitComplaint submitComplaintUseCase;
  final IssueRepository repository;
  final Ref ref;

  ComplaintSubmitNotifier({
    required this.submitComplaintUseCase,
    required this.repository,
    required this.ref,
  }) : super(const ComplaintSubmitState(status: ComplaintSubmitStatus.idle));

  Future<void> submit(Complaint complaint) async {
    state = state.copyWith(status: ComplaintSubmitStatus.submitting, uploadProgress: 0.1);

    // Simulate media upload progress
    for (double i = 0.2; i <= 0.8; i += 0.2) {
      await Future.delayed(const Duration(milliseconds: 150));
      state = state.copyWith(uploadProgress: i);
    }

    final result = await submitComplaintUseCase(SubmitComplaintParams(complaint: complaint));

    state = state.copyWith(uploadProgress: 1.0);

    result.fold(
      (failure) {
        if (failure.message.contains('Offline queue')) {
          // Update offline queue count
          _updateOfflineCount();
          state = state.copyWith(status: ComplaintSubmitStatus.offlineQueued);
        } else {
          state = state.copyWith(
            status: ComplaintSubmitStatus.failure,
            errorMessage: failure.message,
          );
        }
      },
      (success) {
        state = state.copyWith(status: ComplaintSubmitStatus.success);
      },
    );
  }

  Future<void> syncOffline() async {
    state = state.copyWith(status: ComplaintSubmitStatus.submitting, uploadProgress: 0.1);
    
    final result = await repository.syncOfflineComplaints();
    
    result.fold(
      (failure) {
        state = state.copyWith(
          status: ComplaintSubmitStatus.failure,
          errorMessage: failure.message,
        );
      },
      (success) {
        _updateOfflineCount();
        state = state.copyWith(status: ComplaintSubmitStatus.success);
      },
    );
  }

  Future<void> _updateOfflineCount() async {
    final countRes = await repository.getPendingOfflineCount();
    countRes.fold(
      (l) => null,
      (count) => ref.read(offlineQueueCountProvider.notifier).state = count,
    );
  }

  void reset() {
    state = const ComplaintSubmitState(status: ComplaintSubmitStatus.idle);
  }
}

final complaintSubmitNotifierProvider =
    StateNotifierProvider<ComplaintSubmitNotifier, ComplaintSubmitState>((ref) {
  final submitUsecase = ref.watch(submitComplaintUseCaseProvider);
  final repo = ref.watch(issueRepositoryProvider);
  return ComplaintSubmitNotifier(
    submitComplaintUseCase: submitUsecase,
    repository: repo,
    ref: ref,
  );
});

// Stream provider for user complaints
final userComplaintsStreamProvider = StreamProvider.family<List<Complaint>, String>((ref, userId) {
  final repo = ref.watch(issueRepositoryProvider);
  return repo.streamUserComplaints(userId).map((either) => either.fold(
        (failure) => throw Exception(failure.message),
        (complaints) => complaints,
      ));
});

// Stream provider for all complaints (community feed)
final allComplaintsStreamProvider = StreamProvider<List<Complaint>>((ref) {
  final repo = ref.watch(issueRepositoryProvider);
  return repo.streamAllComplaints().map((either) => either.fold(
        (failure) => throw Exception(failure.message),
        (complaints) => complaints,
      ));
});

// Stream provider for a single complaint's details
final singleComplaintStreamProvider = StreamProvider.family<Complaint, String>((ref, id) {
  final repo = ref.watch(issueRepositoryProvider);
  return repo.streamComplaintById(id).map((either) => either.fold(
        (failure) => throw Exception(failure.message),
        (complaint) => complaint,
      ));
});
