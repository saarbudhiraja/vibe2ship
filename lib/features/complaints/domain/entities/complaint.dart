import 'package:equatable/equatable.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
enum ComplaintStatus {
  submitted,
  underReview,
  assigned,
  accepted,
  inProgress,
  resolved,
  awaitingCommunityConfirmation,
  closed,
  reopened,
  duplicate,
  escalated
}

enum ComplaintPriority {
  low,
  medium,
  high,
  critical
}

class ComplaintLocation extends Equatable {
  final double latitude;
  final double longitude;
  final String geohash;
  final double accuracy;
  final String locality;
  final String ward;
  final String district;
  final String state;

  const ComplaintLocation({
    required this.latitude,
    required this.longitude,
    required this.geohash,
    required this.accuracy,
    required this.locality,
    required this.ward,
    required this.district,
    required this.state,
  });

  @override
  List<Object?> get props => [
        latitude,
        longitude,
        geohash,
        accuracy,
        locality,
        ward,
        district,
        state,
      ];

  Map<String, dynamic> toMap() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      'geohash': geohash,
      'accuracy': accuracy,
      'locality': locality,
      'ward': ward,
      'district': district,
      'state': state,
    };
  }

  factory ComplaintLocation.fromMap(Map<String, dynamic> map) {
    return ComplaintLocation(
      latitude: ((map['latitude'] ?? map['lat']) as num).toDouble(),
      longitude: ((map['longitude'] ?? map['lng']) as num).toDouble(),
      geohash: map['geohash'] as String? ?? '',
      accuracy: (map['accuracy'] as num? ?? 0.0).toDouble(),
      locality: map['locality'] as String? ?? '',
      ward: map['ward'] as String? ?? '',
      district: map['district'] as String? ?? '',
      state: map['state'] as String? ?? '',
    );
  }
}

class ComplaintMedia extends Equatable {
  final String type; // 'image' | 'voice' | 'video'
  final String relativePath;
  final String url;
  final double durationSec;
  final int width;
  final int height;
  final String checkHash;

  const ComplaintMedia({
    required this.type,
    required this.relativePath,
    required this.url,
    this.durationSec = 0.0,
    this.width = 0,
    this.height = 0,
    this.checkHash = '',
  });

  @override
  List<Object?> get props => [
        type,
        relativePath,
        url,
        durationSec,
        width,
        height,
        checkHash,
      ];

  Map<String, dynamic> toMap() {
    return {
      'type': type,
      'relativePath': relativePath,
      'url': url,
      'durationSec': durationSec,
      'width': width,
      'height': height,
      'checkHash': checkHash,
    };
  }

  factory ComplaintMedia.fromMap(Map<String, dynamic> map) {
    return ComplaintMedia(
      type: map['type'] as String? ?? 'image',
      relativePath: map['relativePath'] as String? ?? '',
      url: map['url'] as String? ?? '',
      durationSec: (map['durationSec'] as num? ?? 0.0).toDouble(),
      width: (map['width'] as num? ?? 0).toInt(),
      height: (map['height'] as num? ?? 0).toInt(),
      checkHash: map['checkHash'] as String? ?? '',
    );
  }
}

class ComplaintTimeline extends Equatable {
  final DateTime reportedAt;
  final DateTime? assignedAt;
  final DateTime? resolvedAt;
  final DateTime? verifiedAt;
  final DateTime? closedAt;

  const ComplaintTimeline({
    required this.reportedAt,
    this.assignedAt,
    this.resolvedAt,
    this.verifiedAt,
    this.closedAt,
  });

  @override
  List<Object?> get props => [
        reportedAt,
        assignedAt,
        resolvedAt,
        verifiedAt,
        closedAt,
      ];

  Map<String, dynamic> toMap() {
    return {
      'reportedAt': reportedAt.toIso8601String(),
      'assignedAt': assignedAt?.toIso8601String(),
      'resolvedAt': resolvedAt?.toIso8601String(),
      'verifiedAt': verifiedAt?.toIso8601String(),
      'closedAt': closedAt?.toIso8601String(),
    };
  }

  factory ComplaintTimeline.fromMap(Map<String, dynamic> map) {
    DateTime? parseDate(dynamic val) {
  if (val == null) return null;

  if (val is Timestamp) {
    return val.toDate();
  }

  if (val is String) {
    return DateTime.parse(val);
  }

  return null;
}

    return ComplaintTimeline(
      reportedAt: DateTime.parse(map['reportedAt'] as String),
      assignedAt: parseDate(map['assignedAt']),
      resolvedAt: parseDate(map['resolvedAt']),
      verifiedAt: parseDate(map['verifiedAt']),
      closedAt: parseDate(map['closedAt']),
    );
  }
}

class Complaint extends Equatable {
  final String id;
  final String title;
  final String description;
  final String reporterId;
  final String category;
  final ComplaintLocation location;
  final int severityScore;
  final ComplaintPriority priority;
  final ComplaintStatus status;
  final String? parentDuplicateId;
  final List<ComplaintMedia> media;
  final String latestAnalysisId;
  final ComplaintTimeline lifecycleTimeline;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Authority Workflow Fields
  final String? assignedEngineerId;
  final String? assignedEngineerName;
  final String? resolutionNotes;
  final String? workNotes;
  final String? rejectionReason;
  final String? escalationReason;
  final String? completionPhotoUrl;
  final String? completionVideoUrl;

  const Complaint({
    required this.id,
    required this.title,
    required this.description,
    required this.reporterId,
    required this.category,
    required this.location,
    required this.severityScore,
    required this.priority,
    required this.status,
    this.parentDuplicateId,
    required this.media,
    required this.latestAnalysisId,
    required this.lifecycleTimeline,
    required this.createdAt,
    required this.updatedAt,
    this.assignedEngineerId,
    this.assignedEngineerName,
    this.resolutionNotes,
    this.workNotes,
    this.rejectionReason,
    this.escalationReason,
    this.completionPhotoUrl,
    this.completionVideoUrl,
  });

  Complaint copyWith({
    String? id,
    String? title,
    String? description,
    String? reporterId,
    String? category,
    ComplaintLocation? location,
    int? severityScore,
    ComplaintPriority? priority,
    ComplaintStatus? status,
    String? parentDuplicateId,
    List<ComplaintMedia>? media,
    String? latestAnalysisId,
    ComplaintTimeline? lifecycleTimeline,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? assignedEngineerId,
    String? assignedEngineerName,
    String? resolutionNotes,
    String? workNotes,
    String? rejectionReason,
    String? escalationReason,
    String? completionPhotoUrl,
    String? completionVideoUrl,
  }) {
    return Complaint(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      reporterId: reporterId ?? this.reporterId,
      category: category ?? this.category,
      location: location ?? this.location,
      severityScore: severityScore ?? this.severityScore,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      parentDuplicateId: parentDuplicateId ?? this.parentDuplicateId,
      media: media ?? this.media,
      latestAnalysisId: latestAnalysisId ?? this.latestAnalysisId,
      lifecycleTimeline: lifecycleTimeline ?? this.lifecycleTimeline,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      assignedEngineerId: assignedEngineerId ?? this.assignedEngineerId,
      assignedEngineerName: assignedEngineerName ?? this.assignedEngineerName,
      resolutionNotes: resolutionNotes ?? this.resolutionNotes,
      workNotes: workNotes ?? this.workNotes,
      rejectionReason: rejectionReason ?? this.rejectionReason,
      escalationReason: escalationReason ?? this.escalationReason,
      completionPhotoUrl: completionPhotoUrl ?? this.completionPhotoUrl,
      completionVideoUrl: completionVideoUrl ?? this.completionVideoUrl,
    );
  }

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        reporterId,
        category,
        location,
        severityScore,
        priority,
        status,
        parentDuplicateId,
        media,
        latestAnalysisId,
        lifecycleTimeline,
        createdAt,
        updatedAt,
        assignedEngineerId,
        assignedEngineerName,
        resolutionNotes,
        workNotes,
        rejectionReason,
        escalationReason,
        completionPhotoUrl,
        completionVideoUrl,
      ];
}
