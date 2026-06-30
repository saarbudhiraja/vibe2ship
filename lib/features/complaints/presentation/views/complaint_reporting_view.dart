import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/complaint.dart';
import '../providers/complaints_providers.dart';
import 'complaint_feed_view.dart';

class ComplaintReportingView extends ConsumerStatefulWidget {
  const ComplaintReportingView({super.key});

  @override
  ConsumerState<ComplaintReportingView> createState() => _ComplaintReportingViewState();
}

class _ComplaintReportingViewState extends ConsumerState<ComplaintReportingView> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();

  int _currentTab = 0; // 0 = Report, 1 = Feed/Ledger

  String _selectedCategory = 'roads';
  String _selectedLanguage = 'en'; // en, es, hi
  
  double? _latitude;
  double? _longitude;
  String? _geohash;
  bool _gpsPermissionGranted = false;
  bool _isLocating = false;

  List<String> _attachedImages = [];
  bool _isUploadingImage = false;

  bool _isRecordingVoice = false;
  String? _attachedVoicePath;
  int _voiceDurationSec = 0;

  List<Complaint> _duplicateCandidates = [];
  bool _isCheckingDuplicates = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  // Simulates GPS locking and Geohash calculation (precision 7)
  Future<void> _captureLocation() async {
    setState(() {
      _isLocating = true;
    });

    await Future.delayed(const Duration(milliseconds: 800));

    // Simulated coordinates around Bangalore / New Delhi civic zones
    final lat = 12.9719 + (0.001 * (DateTime.now().second % 5));
    final lng = 77.5948 + (0.001 * (DateTime.now().second % 3));
    
    // Custom mock base32 geohash function
    final geohashChars = ['tdr1w7', 'tdr1yd', 'tdr1wx', 'tdr1wz'];
    final hash = geohashChars[DateTime.now().second % geohashChars.length];

    setState(() {
      _latitude = lat;
      _longitude = lng;
      _geohash = hash;
      _gpsPermissionGranted = true;
      _isLocating = false;
    });

    _checkDuplicates();
  }

  // Queries local candidates in same geohash block
  Future<void> _checkDuplicates() async {
    if (_latitude == null || _longitude == null) return;
    
    setState(() {
      _isCheckingDuplicates = true;
    });

    final checkUsecase = ref.read(checkDuplicatesUseCaseProvider);
    final result = await checkUsecase(CheckDuplicatesParams(
      lat: _latitude!,
      lng: _longitude!,
      category: _selectedCategory,
    ));

    result.fold(
      (failure) {
        setState(() {
          _isCheckingDuplicates = false;
        });
      },
      (candidates) {
        setState(() {
          _duplicateCandidates = candidates;
          _isCheckingDuplicates = false;
        });
      },
    );
  }

  // Simulates image file capture and addition
  Future<void> _attachMockImage() async {
    setState(() {
      _isUploadingImage = true;
    });
    await Future.delayed(const Duration(milliseconds: 500));
    final mockImageUrl = 'https://picsum.photos/400/300?random=${DateTime.now().millisecond}';
    setState(() {
      _attachedImages.add(mockImageUrl);
      _isUploadingImage = false;
    });
  }

  // Simulates audio note recording
  Future<void> _toggleVoiceRecording() async {
    if (_isRecordingVoice) {
      // Stop recording
      setState(() {
        _isRecordingVoice = false;
        _attachedVoicePath = 'voice_note_${DateTime.now().millisecondsSinceEpoch}.m4a';
        _voiceDurationSec = 8; // Simulated length
      });
    } else {
      // Start recording
      setState(() {
        _isRecordingVoice = true;
      });
      await Future.delayed(const Duration(seconds: 2));
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_latitude == null || _longitude == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please capture your current GPS location first.'),
          backgroundColor: Colors.amber,
        ),
      );
      return;
    }

    final reporterId = 'citizen_user_123';
    final complaintId = 'complaint_${DateTime.now().millisecondsSinceEpoch}';

    final mediaList = <ComplaintMedia>[];
    for (var img in _attachedImages) {
      mediaList.add(ComplaintMedia(
        type: 'image',
        relativePath: 'images/$complaintId.jpg',
        url: img,
      ));
    }

    if (_attachedVoicePath != null) {
      mediaList.add(ComplaintMedia(
        type: 'voice',
        relativePath: 'audio/$_attachedVoicePath',
        url: 'https://storage.googleapis.com/civora/audio/$_attachedVoicePath',
        durationSec: _voiceDurationSec.toDouble(),
      ));
    }

    // AI Categorization, Severity scoring, and Authority routing simulation parameters
    int generatedSeverity = 45; // Default score
    ComplaintPriority generatedPriority = ComplaintPriority.medium;

    if (_titleController.text.toLowerCase().contains('fire') ||
        _descriptionController.text.toLowerCase().contains('hazard') ||
        _descriptionController.text.toLowerCase().contains('dangerous')) {
      generatedSeverity = 92;
      generatedPriority = ComplaintPriority.critical;
    } else if (_titleController.text.toLowerCase().contains('leak') ||
        _titleController.text.toLowerCase().contains('pot')) {
      generatedSeverity = 60;
      generatedPriority = ComplaintPriority.high;
    }

    final complaint = Complaint(
      id: complaintId,
      title: _titleController.text,
      description: _descriptionController.text,
      reporterId: reporterId,
      category: _selectedCategory,
      location: ComplaintLocation(
        latitude: _latitude!,
        longitude: _longitude!,
        geohash: _geohash ?? 'tdr1w7',
        accuracy: 10.0,
        locality: 'Central Sector',
        ward: 'Ward 14A',
        district: 'Municipal Ward',
        state: 'Karnataka',
      ),
      severityScore: generatedSeverity,
      priority: generatedPriority,
      status: ComplaintStatus.submitted,
      media: mediaList,
      latestAnalysisId: 'analysis_${DateTime.now().millisecondsSinceEpoch}',
      lifecycleTimeline: ComplaintTimeline(reportedAt: DateTime.now()),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    await ref.read(complaintSubmitNotifierProvider.notifier).submit(complaint);
    
    // Clear form on success
    final state = ref.read(complaintSubmitNotifierProvider);
    if (state.status == ComplaintSubmitStatus.success ||
        state.status == ComplaintSubmitStatus.offlineQueued) {
      _titleController.clear();
      _descriptionController.clear();
      setState(() {
        _attachedImages.clear();
        _attachedVoicePath = null;
        _duplicateCandidates.clear();
        _latitude = null;
        _longitude = null;
        _geohash = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final submissionState = ref.watch(complaintSubmitNotifierProvider);
    final isOnline = ref.watch(connectivityProvider);
    final offlineCount = ref.watch(offlineQueueCountProvider);

    // Multi-language translation labels helper
    final Map<String, Map<String, String>> translations = {
      'en': {
        'title': 'New Citizen Report',
        'sub': 'Submit civic issues directly to municipal authorities',
        'field_title': 'Issue Title',
        'field_desc': 'Detailed Description',
        'category': 'Category',
        'location': 'GPS Coordinate Location',
        'media': 'Photo Attachments',
        'voice': 'Voice Memo Recording',
        'submit': 'Submit Complaint',
        'offline_alert': 'Offline Queue Active'
      },
      'es': {
        'title': 'Nueva Queja Ciudadana',
        'sub': 'Presentar problemas cívicos directamente a las autoridades',
        'field_title': 'Título de la Queja',
        'field_desc': 'Descripción Detallada',
        'category': 'Categoría',
        'location': 'Ubicación de Coordenadas GPS',
        'media': 'Fotos Adjuntas',
        'voice': 'Grabación de Notas de Voz',
        'submit': 'Enviar Queja',
        'offline_alert': 'Cola Fuera de Línea Activa'
      },
      'hi': {
        'title': 'नई नागरिक शिकायत',
        'sub': 'नागरिक समस्याओं को सीधे नगर निगम अधिकारियों को भेजें',
        'field_title': 'शिकायत का शीर्षक',
        'field_desc': 'विस्तृत विवरण',
        'category': 'श्रेणी',
        'location': 'जीपीएस स्थान समन्वय',
        'media': 'फ़ोटो संलग्नक',
        'voice': 'आवाज संदेश रिकॉर्डिंग',
        'submit': 'शिकायत दर्ज करें',
        'offline_alert': 'ऑफ़लाइन कतार सक्रिय'
      }
    };

    final labels = translations[_selectedLanguage] ?? translations['en']!;

    if (_currentTab == 1) {
      return Scaffold(
        body: const ComplaintFeedView(),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _currentTab,
          onTap: (index) => setState(() => _currentTab = index),
          backgroundColor: const Color(0xFF0F172A),
          selectedItemColor: Colors.emerald,
          unselectedItemColor: Colors.grey,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.edit_note),
              label: 'Report Issue',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.list_alt),
              label: 'Civic Ledger',
            ),
          ],
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF070B19),
      appBar: AppBar(
        title: Text(labels['title']!, style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        actions: [
          // Language selector
          DropdownButton<String>(
            value: _selectedLanguage,
            underline: const SizedBox(),
            dropdownColor: const Color(0xFF0F172A),
            icon: const Icon(Icons.language, color: Colors.emerald),
            items: const [
              DropdownMenuItem(value: 'en', child: Text('English ', style: TextStyle(fontSize: 12))),
              DropdownMenuItem(value: 'es', child: Text('Español ', style: TextStyle(fontSize: 12))),
              DropdownMenuItem(value: 'hi', child: Text('हिंदी ', style: TextStyle(fontSize: 12))),
            ],
            onChanged: (val) {
              if (val != null) {
                setState(() {
                  _selectedLanguage = val;
                });
              }
            },
          ),
          // Online / Offline simulator switch
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12.0),
            child: Row(
              children: [
                Icon(
                  isOnline ? Icons.wifi : Icons.wifi_off,
                  color: isOnline ? Colors.green : Colors.amber,
                  size: 18,
                ),
                const SizedBox(width: 4),
                Switch(
                  value: isOnline,
                  activeColor: Colors.green,
                  inactiveThumbColor: Colors.amber,
                  onChanged: (val) {
                    ref.read(connectivityProvider.notifier).state = val;
                    if (val && offlineCount > 0) {
                      // Automate sync when online resumes
                      ref.read(complaintSubmitNotifierProvider.notifier).syncOffline();
                    }
                  },
                ),
              ],
            ),
          )
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Offline sync banner if needed
              if (!isOnline)
                Card(
                  color: Colors.amber.withOpacity(0.15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Colors.amber, width: 0.5),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Row(
                      children: [
                        const Icon(Icons.offline_bolt, color: Colors.amber),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                labels['offline_alert']!,
                                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.amber),
                              ),
                              Text(
                                'Your report will be safely saved locally and auto-synchronized when your connection returns. ($offlineCount pending).',
                                style: const TextStyle(fontSize: 11, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              const SizedBox(height: 12),

              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title field
                    TextFormField(
                      controller: _titleController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: labels['field_title'],
                        labelStyle: const TextStyle(color: Colors.grey),
                        fillColor: const Color(0xFF0F172A),
                        filled: true,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Colors.emerald, width: 1.5),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please provide a standard title.';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Description field
                    TextFormField(
                      controller: _descriptionController,
                      maxLines: 4,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: labels['field_desc'],
                        labelStyle: const TextStyle(color: Colors.grey),
                        fillColor: const Color(0xFF0F172A),
                        filled: true,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Colors.emerald, width: 1.5),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please describe the reported hazard in details.';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Category dropdown row
                    Card(
                      color: const Color(0xFF0F172A),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            Text(labels['category']!, style: const TextStyle(fontWeight: FontWeight.bold)),
                            DropdownButton<String>(
                              value: _selectedCategory,
                              dropdownColor: const Color(0xFF0F172A),
                              style: const TextStyle(color: Colors.white),
                              items: const [
                                DropdownMenuItem(value: 'roads', child: Text('Roads & Potholes')),
                                DropdownMenuItem(value: 'water', child: Text('Water & Seepages')),
                                DropdownMenuItem(value: 'sanitation', child: Text('Sanitation / Trash')),
                                DropdownMenuItem(value: 'lighting', child: Text('Streetlights & Grid')),
                                DropdownMenuItem(value: 'safety', child: Text('Safety / Hazards')),
                              ],
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedCategory = val;
                                  });
                                  _checkDuplicates();
                                }
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // GPS Capture Widget
                    Card(
                      color: const Color(0xFF0F172A),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.gps_fixed, color: Colors.blue),
                                const SizedBox(width: 12),
                                Text(labels['location']!, style: const TextStyle(fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const SizedBox(height: 12),
                            if (_latitude != null && _longitude != null) ...[
                              Text('Latitude: $_latitude', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 13, color: Colors.grey)),
                              Text('Longitude: $_longitude', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 13, color: Colors.grey)),
                              Text('Geohash grid: $_geohash', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 13, color: Colors.emerald, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 12),
                            ],
                            ElevatedButton.icon(
                              onPressed: _isLocating ? null : _captureLocation,
                              icon: _isLocating
                                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                                  : const Icon(Icons.my_location),
                              label: Text(_isLocating ? 'Locking GPS...' : 'Acquire High-Accuracy GPS Coordinates'),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Media uploader widget
                    Card(
                      color: const Color(0xFF0F172A),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.between,
                              children: [
                                Text(labels['media']!, style: const TextStyle(fontWeight: FontWeight.bold)),
                                IconButton(
                                  icon: const Icon(Icons.add_photo_alternate, color: Colors.emerald),
                                  onPressed: _isUploadingImage ? null : _attachMockImage,
                                ),
                              ],
                            ),
                            if (_attachedImages.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              SizedBox(
                                height: 80,
                                child: ListView.builder(
                                  scrollDirection: Axis.horizontal,
                                  itemCount: _attachedImages.length,
                                  itemBuilder: (context, idx) {
                                    return Padding(
                                      padding: const EdgeInsets.only(right: 8.0),
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: Image.network(
                                          _attachedImages[idx],
                                          width: 80,
                                          height: 80,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ] else ...[
                              const Padding(
                                padding: EdgeInsets.only(top: 8.0),
                                child: Text('No photos attached yet.', style: TextStyle(color: Colors.grey, fontSize: 12)),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Voice recorder
                    Card(
                      color: const Color(0xFF0F172A),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(labels['voice']!, style: const TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 12),
                            if (_isRecordingVoice)
                              Row(
                                children: const [
                                  Icon(Icons.mic, color: Colors.red),
                                  SizedBox(width: 8),
                                  Text('Recording Audio Memo... (Sound waves bouncing)', style: TextStyle(color: Colors.red, fontSize: 12)),
                                ],
                              ),
                            if (_attachedVoicePath != null)
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 8.0),
                                child: Row(
                                  children: [
                                    const Icon(Icons.audio_file, color: Colors.blue),
                                    const SizedBox(width: 8),
                                    Text('Voice Note attached: $_voiceDurationSec sec', style: const TextStyle(fontSize: 12)),
                                    const Spacer(),
                                    IconButton(
                                      icon: const Icon(Icons.delete, color: Colors.red),
                                      onPressed: () {
                                        setState(() {
                                          _attachedVoicePath = null;
                                        });
                                      },
                                    ),
                                  ],
                                ),
                              ),
                            ElevatedButton.icon(
                              onPressed: _toggleVoiceRecording,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _isRecordingVoice ? Colors.red : const Color(0xFF1E293B),
                                foregroundColor: Colors.white,
                              ),
                              icon: Icon(_isRecordingVoice ? Icons.stop : Icons.mic),
                              label: Text(_isRecordingVoice ? 'Stop Recording Memo' : 'Record Ambient Voice Complaint'),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Duplicate Warning Notification Overlay
                    if (_duplicateCandidates.isNotEmpty)
                      Card(
                        color: Colors.orange.withOpacity(0.12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: const BorderSide(color: Colors.orange, width: 0.8),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Row(
                                children: const [
                                  Icon(Icons.warning_amber_rounded, color: Colors.orange),
                                  SizedBox(width: 12),
                                  Text(
                                    'Spatial Duplicate Hazard Detected!',
                                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.orange),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'A reported civic issue already exists in this precise geohash sector. You can merge your feedback to upvote the original ticket and speed up resolution!',
                                style: TextStyle(fontSize: 12, color: Colors.white70),
                              ),
                              const SizedBox(height: 12),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.black),
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Successfully upvoted and fused into the original ticket!'),
                                      backgroundColor: Colors.green,
                                    ),
                                  );
                                  setState(() {
                                    _duplicateCandidates.clear();
                                  });
                                },
                                child: const Text('Merge & Upvote Existing Issue'),
                              ),
                            ],
                          ),
                        ),
                      ),

                    const SizedBox(height: 16),

                    // Submit indicators
                    if (submissionState.status == ComplaintSubmitStatus.submitting) ...[
                      LinearProgressIndicator(value: submissionState.uploadProgress, color: Colors.emerald, backgroundColor: Colors.slate),
                      const SizedBox(height: 12),
                      Center(child: Text('Uploading media and calculating AI priority pipeline... ${(submissionState.uploadProgress * 100).toInt()}%', style: const TextStyle(fontSize: 11, color: Colors.grey))),
                      const SizedBox(height: 16),
                    ],

                    // Submission feedback snackbar equivalents inside container
                    if (submissionState.status == ComplaintSubmitStatus.success) ...[
                      const Card(
                        color: Colors.green,
                        child: Padding(
                          padding: EdgeInsets.all(12.0),
                          child: Text('Complaint successfully filed! AI routing assigned standard priority and dispatched to corresponding municipal authorities.', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    if (submissionState.status == ComplaintSubmitStatus.offlineQueued) ...[
                      Card(
                        color: Colors.blue.shade900,
                        child: const Padding(
                          padding: EdgeInsets.all(12.0),
                          child: Text('No network detected. Saved report to local offline queue. Will auto-sync when internet returns.', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    if (submissionState.status == ComplaintSubmitStatus.failure) ...[
                      Card(
                        color: Colors.red,
                        child: Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text('Error: ${submissionState.errorMessage}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Submit button
                    ElevatedButton(
                      onPressed: submissionState.status == ComplaintSubmitStatus.submitting ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: Colors.emerald,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Center(
                        child: Text(
                          labels['submit']!,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentTab,
        onTap: (index) => setState(() => _currentTab = index),
        backgroundColor: const Color(0xFF0F172A),
        selectedItemColor: Colors.emerald,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.edit_note),
            label: 'Report Issue',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.list_alt),
            label: 'Civic Ledger',
          ),
        ],
      ),
    );
  }
}
