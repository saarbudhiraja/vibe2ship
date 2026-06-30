import 'package:cloud_firestore/cloud_firestore.dart';
import '../../domain/entities/complaint.dart';

class ComplaintModel extends Complaint {
  const ComplaintModel({
    required super.id,
    required super.title,
    required super.description,
    required super.reporterId,
    required super.category,
    required super.location,
    required super.severityScore,
    required super.priority,
    required super.status,
    super.parentDuplicateId,
    required super.media,
    required super.latestAnalysisId,
    required super.lifecycleTimeline,
    required super.createdAt,
    required super.updatedAt,
    super.assignedEngineerId,
    super.assignedEngineerName,
    super.resolutionNotes,
    super.workNotes,
    super.rejectionReason,
    super.escalationReason,
    super.completionPhotoUrl,
    super.completionVideoUrl,
  });

  factory ComplaintModel.fromEntity(Complaint entity) {
    return ComplaintModel(
      id: entity.id,
      title: entity.title,
      description: entity.description,
      reporterId: entity.reporterId,
      category: entity.category,
      location: entity.location,
      severityScore: entity.severityScore,
      priority: entity.priority,
      status: entity.status,
      parentDuplicateId: entity.parentDuplicateId,
      media: entity.media,
      latestAnalysisId: entity.latestAnalysisId,
      lifecycleTimeline: entity.lifecycleTimeline,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      assignedEngineerId: entity.assignedEngineerId,
      assignedEngineerName: entity.assignedEngineerName,
      resolutionNotes: entity.resolutionNotes,
      workNotes: entity.workNotes,
      rejectionReason: entity.rejectionReason,
      escalationReason: entity.escalationReason,
      completionPhotoUrl: entity.completionPhotoUrl,
      completionVideoUrl: entity.completionVideoUrl,
    );
  }

  factory ComplaintModel.fromMap(Map<String, dynamic> map, String docId) {
    // Helper to safely parse Dates from Firestore Timestamp, String or milliseconds
    DateTime parseDateTime(dynamic value) {
      if (value == null) return DateTime.now();
      if (value is Timestamp) return value.toDate();
      if (value is String) return DateTime.parse(value);
      if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
      return DateTime.now();
    }

    final locationMap = map['location'] as Map<String, dynamic>? ?? {};
    final mediaList = (map['media'] as List<dynamic>? ?? [])
        .map((m) => ComplaintMedia.fromMap(Map<String, dynamic>.from(m)))
        .toList();

    final timelineMap =
    (map['lifecycleTimeline'] ??
    map['timeline']) as Map<String, dynamic>? ?? {};

    // Map string values to corresponding enums safely
    ComplaintPriority parsePriority(String? p) {
      switch (p) {
        case 'low':
          return ComplaintPriority.low;
        case 'medium':
          return ComplaintPriority.medium;
        case 'high':
          return ComplaintPriority.high;
        case 'critical':
          return ComplaintPriority.critical;
        default:
          return ComplaintPriority.low;
      }
    }

    ComplaintStatus parseStatus(String? s) {
      switch (s) {
        case 'submitted':
          return ComplaintStatus.submitted;
        case 'under_review':
          return ComplaintStatus.underReview;
        case 'assigned':
          return ComplaintStatus.assigned;
        case 'accepted':
          return ComplaintStatus.accepted;
        case 'in_progress':
          return ComplaintStatus.inProgress;
        case 'resolved':
          return ComplaintStatus.resolved;
        case 'awaiting_community_confirmation':
          return ComplaintStatus.awaitingCommunityConfirmation;
        case 'closed':
          return ComplaintStatus.closed;
        case 'reopened':
          return ComplaintStatus.reopened;
        case 'duplicate':
          return ComplaintStatus.duplicate;
        case 'escalated':
          return ComplaintStatus.escalated;
        default:
          return ComplaintStatus.submitted;
      }
    }

    return ComplaintModel(
      id: docId,
      title: map['title'] as String? ?? '',
      description: map['description'] as String? ?? '',
      reporterId: map['reporterId'] as String? ?? '',
      category: map['category'] as String? ?? 'roads',
      location: ComplaintLocation.fromMap(locationMap),
      severityScore: (map['severityScore'] as num? ?? 0).toInt(),
      priority: parsePriority(map['priority'] as String?),
      status: parseStatus(map['status'] as String?),
      parentDuplicateId: map['parentDuplicateId'] as String?,
      media: mediaList,
      latestAnalysisId: map['latestAnalysisId'] as String? ?? '',
      lifecycleTimeline: ComplaintTimeline(
        reportedAt: parseDateTime(timelineMap['reportedAt']),
        assignedAt: timelineMap['assignedAt'] != null ? parseDateTime(timelineMap['assignedAt']) : null,
        resolvedAt: timelineMap['resolvedAt'] != null ? parseDateTime(timelineMap['resolvedAt']) : null,
        verifiedAt: timelineMap['verifiedAt'] != null ? parseDateTime(timelineMap['verifiedAt']) : null,
        closedAt: timelineMap['closedAt'] != null ? parseDateTime(timelineMap['closedAt']) : null,
      ),
      createdAt: parseDateTime(
        map['createdAt'] ?? map['timestamp'],
        ),
        
      updatedAt: parseDateTime(
        map['updatedAt'] ?? map['timestamp'],
        ),
      assignedEngineerId: map['assignedEngineerId'] as String?,
      assignedEngineerName: map['assignedEngineerName'] as String?,
      resolutionNotes: map['resolutionNotes'] as String?,
      workNotes: map['workNotes'] as String?,
      rejectionReason: map['rejectionReason'] as String?,
      escalationReason: map['escalationReason'] as String?,
      completionPhotoUrl: map['completionPhotoUrl'] as String?,
      completionVideoUrl: map['completionVideoUrl'] as String?,
    );
  }

  Map<String, dynamic> toFirestore() {
    String priorityToString(ComplaintPriority p) {
      switch (p) {
        case ComplaintPriority.low:
          return 'low';
        case ComplaintPriority.medium:
          return 'medium';
        case ComplaintPriority.high:
          return 'high';
        case ComplaintPriority.critical:
          return 'critical';
      }
    }

    String statusToString(ComplaintStatus s) {
      switch (s) {
        case ComplaintStatus.submitted:
          return 'submitted';
        case ComplaintStatus.underReview:
          return 'under_review';
        case ComplaintStatus.assigned:
          return 'assigned';
        case ComplaintStatus.accepted:
          return 'accepted';
        case ComplaintStatus.inProgress:
          return 'in_progress';
        case ComplaintStatus.resolved:
          return 'resolved';
        case ComplaintStatus.awaitingCommunityConfirmation:
          return 'awaiting_community_confirmation';
        case ComplaintStatus.closed:
          return 'closed';
        case ComplaintStatus.reopened:
          return 'reopened';
        case ComplaintStatus.duplicate:
          return 'duplicate';
        case ComplaintStatus.escalated:
          return 'escalated';
      }
    }

    return {
      'title': title,
      'description': description,
      'reporterId': reporterId,
      'category': category,
      'location': location.toMap(),
      'severityScore': severityScore,
      'priority': priorityToString(priority),
      'status': statusToString(status),
      'parentDuplicateId': parentDuplicateId,
      'media': media.map((m) => m.toMap()).toList(),
      'latestAnalysisId': latestAnalysisId,
      'lifecycleTimeline': {
        'reportedAt': Timestamp.fromDate(lifecycleTimeline.reportedAt),
        'assignedAt': lifecycleTimeline.assignedAt != null ? Timestamp.fromDate(lifecycleTimeline.assignedAt!) : null,
        'resolvedAt': lifecycleTimeline.resolvedAt != null ? Timestamp.fromDate(lifecycleTimeline.resolvedAt!) : null,
        'verifiedAt': lifecycleTimeline.verifiedAt != null ? Timestamp.fromDate(lifecycleTimeline.verifiedAt!) : null,
        'closedAt': lifecycleTimeline.closedAt != null ? Timestamp.fromDate(lifecycleTimeline.closedAt!) : null,
      },
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'assignedEngineerId': assignedEngineerId,
      'assignedEngineerName': assignedEngineerName,
      'resolutionNotes': resolutionNotes,
      'workNotes': workNotes,
      'rejectionReason': rejectionReason,
      'escalationReason': escalationReason,
      'completionPhotoUrl': completionPhotoUrl,
      'completionVideoUrl': completionVideoUrl,
    };
  }
}
