import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/complaint.dart';
import '../repositories/issue_repository.dart';

class CheckDuplicates extends UseCase<List<Complaint>, CheckDuplicatesParams> {
  final IssueRepository repository;

  CheckDuplicates(this.repository);

  @override
  Future<Either<Failure, List<Complaint>>> call(CheckDuplicatesParams params) async {
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
    this.precision = 7,
  });
}
