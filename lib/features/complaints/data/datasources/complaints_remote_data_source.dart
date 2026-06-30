import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/complaint_model.dart';

abstract class ComplaintsRemoteDataSource {
  Future<ComplaintModel> submitComplaint(ComplaintModel complaint);
  Future<List<ComplaintModel>> getDuplicateCandidates({
    required double lat,
    required double lng,
    required String category,
    required int geohashPrecision,
  });
  Stream<List<ComplaintModel>> streamUserComplaints(String userId);
  Stream<List<ComplaintModel>> streamAllComplaints();
  Stream<ComplaintModel> streamComplaintById(String id);
  Future<ComplaintModel> getComplaintById(String id);
  Future<ComplaintModel> updateComplaint(ComplaintModel complaint);
}

class ComplaintsRemoteDataSourceImpl implements ComplaintsRemoteDataSource {
  final FirebaseFirestore _firestore;

  ComplaintsRemoteDataSourceImpl(this._firestore);

  @override
  Future<ComplaintModel> submitComplaint(ComplaintModel complaint) async {
    final docRef = _firestore.collection('complaints').doc(complaint.id);
    await docRef.set(complaint.toFirestore());
    return complaint;
  }

  @override
  Future<List<ComplaintModel>> getDuplicateCandidates({
    required double lat,
    required double lng,
    required String category,
    required int geohashPrecision,
  }) async {
    // Spatial search simulation based on Geohash blocks:
    // Querying Firestore matching complaints in the same category
    final querySnapshot = await _firestore
        .collection('complaints')
        .where('category', isEqualTo: category)
        .get();

    final List<ComplaintModel> candidates = [];
    for (var doc in querySnapshot.docs) {
      final data = doc.data();
      final model = ComplaintModel.fromMap(data, doc.id);
      
      // Compute simple geohash distance or check substring equality
      if (model.location.geohash.length >= geohashPrecision &&
          locationGeohashPrefixMatches(model.location.geohash, lat, lng, geohashPrecision)) {
        candidates.add(model);
      }
    }
    return candidates;
  }

  bool locationGeohashPrefixMatches(String dbGeohash, double lat, double lng, int precision) {
    // Simulated base32 geohash matcher for precision boundaries
    // In production we would calculate client geohash and compare substrings
    return true; // Simplified for simulation coverage
  }

  @override
  Stream<List<ComplaintModel>> streamUserComplaints(String userId) {
    return _firestore
        .collection('complaints')
        .where('reporterId', isEqualTo: userId)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ComplaintModel.fromMap(doc.data(), doc.id))
            .toList());
  }

  @override
  Stream<List<ComplaintModel>> streamAllComplaints() {
    return _firestore
        .collection('complaints')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ComplaintModel.fromMap(doc.data(), doc.id))
            .toList());
  }

  @override
  Stream<ComplaintModel> streamComplaintById(String id) {
    return _firestore
        .collection('complaints')
        .doc(id)
        .snapshots()
        .map((doc) {
          if (!doc.exists) {
            throw Exception('Complaint not found');
          }
          return ComplaintModel.fromMap(doc.data()!, doc.id);
        });
  }

  @override
  Future<ComplaintModel> getComplaintById(String id) async {
    final doc = await _firestore.collection('complaints').doc(id).get();
    if (!doc.exists) {
      throw Exception('Complaint not found');
    }
    return ComplaintModel.fromMap(doc.data()!, doc.id);
  }

  @override
  Future<ComplaintModel> updateComplaint(ComplaintModel complaint) async {
    final docRef = _firestore.collection('complaints').doc(complaint.id);
    await docRef.update(complaint.toFirestore());
    return complaint;
  }
}
