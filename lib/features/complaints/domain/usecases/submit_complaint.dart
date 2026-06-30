import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/complaint.dart';
import '../repositories/issue_repository.dart';

class SubmitComplaint extends UseCase<Complaint, SubmitComplaintParams> {
  final IssueRepository repository;

  SubmitComplaint(this.repository);

  @override
  Future<Either<Failure, Complaint>> call(SubmitComplaintParams params) async {
    return await repository.submitComplaint(params.complaint);
  }
}

class SubmitComplaintParams {
  final Complaint complaint;

  SubmitComplaintParams({required this.complaint});
}
