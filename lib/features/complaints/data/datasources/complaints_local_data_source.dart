import 'dart:convert';
import '../models/complaint_model.dart';

abstract class ComplaintsLocalDataSource {
  Future<void> cachePendingComplaint(ComplaintModel complaint);
  Future<List<ComplaintModel>> getCachedPendingComplaints();
  Future<void> clearPendingComplaint(String id);
}

class ComplaintsLocalDataSourceImpl implements ComplaintsLocalDataSource {
  // In-memory queue as SQLite / SharedPreferences mock for fast runtime execution in our env
  final List<ComplaintModel> _offlineQueue = [];

  @override
  Future<void> cachePendingComplaint(ComplaintModel complaint) async {
    _offlineQueue.add(complaint);
    await Future.delayed(const Duration(milliseconds: 100));
  }

  @override
  Future<List<ComplaintModel>> getCachedPendingComplaints() async {
    await Future.delayed(const Duration(milliseconds: 100));
    return List.from(_offlineQueue);
  }

  @override
  Future<void> clearPendingComplaint(String id) async {
    _offlineQueue.removeWhere((item) => item.id == id);
    await Future.delayed(const Duration(milliseconds: 100));
  }
}
