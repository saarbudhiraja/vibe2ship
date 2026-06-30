import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../auth/domain/entities/user_entity.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../domain/entities/complaint.dart';
import '../providers/complaints_providers.dart';
import '../../auth/presentation/providers/auth_providers.dart';
import '../../auth/presentation/providers/developer_debug_provider.dart';

class AuthorityDashboardView extends ConsumerStatefulWidget {
  const AuthorityDashboardView({super.key});

  @override
  ConsumerState<AuthorityDashboardView> createState() => _AuthorityDashboardViewState();
}

class _AuthorityDashboardViewState extends ConsumerState<AuthorityDashboardView> {
  // Filters & Search State
  String _searchQuery = '';
  String _selectedStatus = 'all';
  String _selectedCategory = 'all';
  String _selectedPriority = 'all';
  String _selectedWard = 'all';
  String _selectedEngineer = 'all';

  // Selected Complaint for detailed view (split screen or modal)
  String? _selectedComplaintId;

  // Active inputs for action panels
  final _notesController = TextEditingController();
  final _reasonController = TextEditingController();
  String? _selectedEngineerIdForAssignment;
  String? _selectedMockPhotoUrl;
  String? _selectedMockVideoUrl;

  bool _isActionLoading = false;

  // Mock list of field engineers for assignments and workload tracking
  final List<Map<String, String>> _mockEngineers = [
    {'id': 'eng_01', 'name': 'Ravi Kumar', 'dept': 'Municipal Water Board'},
    {'id': 'eng_02', 'name': 'Suresh Patel', 'dept': 'Electrical Utility Grid'},
    {'id': 'eng_03', 'name': 'Meera Rao', 'dept': 'Department of Public Works'},
  ];

  // Mock before-and-after photo templates for field engineers
  final List<Map<String, String>> _mockPhotos = [
    {
      'name': 'Pothole Filled',
      'url': 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400'
    },
    {
      'name': 'Drainage Cleared',
      'url': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=400'
    },
    {
      'name': 'Streetlight Repaired',
      'url': 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&q=80&w=400'
    },
  ];

  @override
  void dispose() {
    _notesController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Color _getStatusColor(ComplaintStatus s) {
    switch (s) {
      case ComplaintStatus.submitted:
        return Colors.blue;
      case ComplaintStatus.underReview:
        return Colors.purple;
      case ComplaintStatus.assigned:
        return Colors.cyan;
      case ComplaintStatus.accepted:
        return Colors.indigo;
      case ComplaintStatus.inProgress:
        return Colors.amber;
      case ComplaintStatus.resolved:
        return Colors.lightGreen;
      case ComplaintStatus.awaitingCommunityConfirmation:
        return Colors.orange;
      case ComplaintStatus.closed:
        return Colors.green;
      case ComplaintStatus.reopened:
        return Colors.deepOrange;
      case ComplaintStatus.duplicate:
        return Colors.grey;
      case ComplaintStatus.escalated:
        return Colors.redAccent;
    }
  }

  Color _getPriorityColor(ComplaintPriority p) {
    switch (p) {
      case ComplaintPriority.low:
        return Colors.green;
      case ComplaintPriority.medium:
        return Colors.blue;
      case ComplaintPriority.high:
        return Colors.orange;
      case ComplaintPriority.critical:
        return Colors.red;
    }
  }

  IconData _getCategoryIcon(String cat) {
    switch (cat.toLowerCase()) {
      case 'roads':
        return Icons.add_road_outlined;
      case 'water':
        return Icons.water_drop_outlined;
      case 'sanitation':
        return Icons.delete_outline;
      case 'lighting':
        return Icons.lightbulb_outline;
      case 'safety':
        return Icons.health_and_safety_outlined;
      default:
        return Icons.report_problem_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOnline = ref.watch(connectivityProvider);
    final userAsync = ref.watch(authStateChangesProvider);
    final complaintsAsync = ref.watch(allComplaintsStreamProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: userAsync.when(
          data: (user) => Row(
            children: [
              if (user?.photoUrl != null)
                CircleAvatar(
                  backgroundImage: NetworkImage(user!.photoUrl!),
                  radius: 16,
                )
              else
                const CircleAvatar(
                  backgroundColor: Colors.emerald,
                  radius: 16,
                  child: Icon(Icons.person, size: 16, color: Colors.white),
                ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user?.displayName ?? 'Municipal Authority',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    user?.role.displayName.toUpperCase() ?? 'OFFICER',
                    style: const TextStyle(
                      fontSize: 10,
                      color: Colors.emerald,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.1,
                      fontFamily: 'JetBrains Mono',
                    ),
                  ),
                ],
              ),
            ],
          ),
          loading: () => const Text('Loading Authority profile...'),
          error: (_, __) => const Text('Authority Console'),
        ),
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        actions: [
          // Online / Offline Switch Indicator
          InkWell(
            onTap: () {
              ref.read(connectivityProvider.notifier).update((state) => !state);
            },
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                color: isOnline ? Colors.green.withOpacity(0.1) : Colors.amber.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isOnline ? Colors.green : Colors.amber,
                  width: 0.8,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    isOnline ? Icons.wifi : Icons.wifi_off,
                    size: 14,
                    color: isOnline ? Colors.green : Colors.amber,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    isOnline ? 'ONLINE' : 'OFFLINE',
                    style: TextStyle(
                      color: isOnline ? Colors.green : Colors.amber,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'JetBrains Mono',
                    ),
                  ),
                ],
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.redAccent),
            onPressed: () async {
              ref.read(devDebugEnabledProvider.notifier).state = false;
              ref.read(devSelectedRoleProvider.notifier).state = UserRole.citizen;
              await ref.read(authNotifierProvider.notifier).logout();
              if (!context.mounted) return;
              context.go('/login');
              },
          ),
        ],
      ),
      body: userAsync.when(
        data: (user) {
          if (user == null) {
            return const Center(
              child: Text(
                'Please sign in as an authorized Municipal Official.',
                style: TextStyle(color: Colors.white70),
              ),
            );
          }
          
          return complaintsAsync.when(
            data: (allComplaints) {
              // Extract unique options for dropdown filters
              final statusOptions = ['all', ...ComplaintStatus.values.map((s) => s.name)];
              final categoryOptions = ['all', 'roads', 'water', 'sanitation', 'lighting', 'safety'];
              final priorityOptions = ['all', ...ComplaintPriority.values.map((p) => p.name)];
              final wardOptions = ['all', ...allComplaints.map((c) => c.location.ward).where((w) => w.isNotEmpty).toSet()];
              final engineerOptions = ['all', 'unassigned', ..._mockEngineers.map((e) => e['name']!)];

              // Apply Filters & Search query
              final filteredComplaints = allComplaints.where((c) {
                // Search filter
                if (_searchQuery.isNotEmpty) {
                  final query = _searchQuery.toLowerCase();
                  final matchId = c.id.toLowerCase().contains(query);
                  final matchTitle = c.title.toLowerCase().contains(query);
                  final matchLoc = c.location.locality.toLowerCase().contains(query) ||
                      c.location.ward.toLowerCase().contains(query);
                  if (!matchId && !matchTitle && !matchLoc) return false;
                }

                // Status filter
                if (_selectedStatus != 'all' && c.status.name != _selectedStatus) {
                  return false;
                }

                // Category filter
                if (_selectedCategory != 'all' && c.category.toLowerCase() != _selectedCategory.toLowerCase()) {
                  return false;
                }

                // Priority filter
                if (_selectedPriority != 'all' && c.priority.name != _selectedPriority) {
                  return false;
                }

                // Ward filter
                if (_selectedWard != 'all' && c.location.ward != _selectedWard) {
                  return false;
                }

                // Engineer filter
                if (_selectedEngineer != 'all') {
                  if (_selectedEngineer == 'unassigned') {
                    if (c.assignedEngineerId != null && c.assignedEngineerId!.isNotEmpty) return false;
                  } else {
                    if (c.assignedEngineerName != _selectedEngineer) return false;
                  }
                }

                // If user is a Field Engineer, restrict viewing to complaints assigned to them specifically
                if (user.role == UserRole.fieldEngineer) {
                  if (c.assignedEngineerId != user.uid) {
                    return false;
                  }
                }

                return true;
              }).toList();

              // Sort complaints: critical first, then newest
              filteredComplaints.sort((a, b) {
                if (a.priority == ComplaintPriority.critical && b.priority != ComplaintPriority.critical) {
                  return -1;
                }
                if (b.priority == ComplaintPriority.critical && a.priority != ComplaintPriority.critical) {
                  return 1;
                }
                return b.createdAt.compareTo(a.createdAt);
              });

              // Extract operational metrics
              final totalCount = allComplaints.length;
              final unresolvedCount = allComplaints.where((c) => c.status != ComplaintStatus.closed && c.status != ComplaintStatus.resolved).length;
              final activeEscalated = allComplaints.where((c) => c.status == ComplaintStatus.escalated).length;
              
              // Calculate SLA violations (more than 48 hours pending in non-completed status)
              final slaViolationsCount = allComplaints.where((c) {
                if (c.status == ComplaintStatus.closed || c.status == ComplaintStatus.resolved) return false;
                final ageHours = DateTime.now().difference(c.createdAt).inHours;
                return ageHours > 48; // SLA is 48 hours
              }).length;

              // Build responsive grid layout
              return LayoutBuilder(
                builder: (context, constraints) {
                  final isWideScreen = constraints.maxWidth > 900;

                  return Column(
                    children: [
                      // Role-specific Metric Header Banner
                      _buildMetricsBanner(
                        role: user.role,
                        total: totalCount,
                        unresolved: unresolvedCount,
                        escalated: activeEscalated,
                        slaViolations: slaViolationsCount,
                      ),

                      // Filter & Search Controls Panel
                      _buildFilterPanel(
                        statusOptions: statusOptions,
                        categoryOptions: categoryOptions,
                        priorityOptions: priorityOptions,
                        wardOptions: wardOptions,
                        engineerOptions: engineerOptions,
                        hideEngineerFilter: user.role == UserRole.fieldEngineer,
                      ),

                      // Main lists/detail split view
                      Expanded(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Left list pane
                            Expanded(
                              flex: 4,
                              child: _buildQueueList(
                                complaints: filteredComplaints,
                                selectedId: _selectedComplaintId,
                                onSelect: (id) {
                                  setState(() {
                                    _selectedComplaintId = id;
                                    _notesController.clear();
                                    _reasonController.clear();
                                    _selectedEngineerIdForAssignment = null;
                                    _selectedMockPhotoUrl = null;
                                    _selectedMockVideoUrl = null;
                                  });
                                  if (!isWideScreen) {
                                    _showDetailBottomSheet(context, id, user);
                                  }
                                },
                              ),
                            ),

                            // Right detail panel (only on wide screens)
                            if (isWideScreen)
                              Expanded(
                                flex: 5,
                                child: Container(
                                  decoration: const BoxDecoration(
                                    border: Border(
                                      left: BorderSide(color: Color(0xFF334155), width: 1),
                                    ),
                                    color: Color(0xFF0F172A),
                                  ),
                                  child: _selectedComplaintId == null
                                      ? const Center(
                                          child: Column(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Icon(Icons.assignment_outlined, size: 48, color: Colors.slate),
                                              SizedBox(height: 12),
                                              Text(
                                                'Select a complaint from the queue\nto view operational parameters and update work state.',
                                                textAlign: TextAlign.center,
                                                style: TextStyle(color: Colors.slate, fontSize: 13),
                                              ),
                                            ],
                                          ),
                                        )
                                      : _buildDetailPanel(
                                          allComplaints.firstWhere((c) => c.id == _selectedComplaintId),
                                          user,
                                        ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              );
            },
            loading: () => const Center(
              child: CircularProgressIndicator(color: Colors.emerald),
            ),
            error: (e, _) => Center(
              child: Text(
                'Failed to load complaints feed: $e',
                style: const TextStyle(color: Colors.redAccent),
              ),
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: Colors.emerald),
        ),
        error: (e, _) => Center(
          child: Text(
            'Authentication Error: $e',
            style: const TextStyle(color: Colors.redAccent),
          ),
        ),
      ),
    );
  }

  Widget _buildMetricsBanner({
    required UserRole role,
    required int total,
    required int unresolved,
    required int escalated,
    required int slaViolations,
  }) {
    // Determine metrics matching active role requirements
    List<Widget> cards = [];

    Widget metricCard(String title, String val, IconData icon, Color col) {
      return Expanded(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: col.withOpacity(0.3), width: 1),
          ),
          child: Row(
            children: [
              Icon(icon, color: col, size: 22),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: const TextStyle(color: Colors.slate, fontSize: 10, fontWeight: FontWeight.w500),
                  ),
                  Text(
                    val,
                    style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'JetBrains Mono'),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }

    if (role == UserRole.fieldEngineer) {
      cards = [
        metricCard('MY ASSIGNED', total.toString(), Icons.assignment_turned_in, Colors.cyan),
        metricCard('ACTIVE TASKS', unresolved.toString(), Icons.engineering, Colors.amber),
        metricCard('SLA URGENT', slaViolations.toString(), Icons.timer, Colors.redAccent),
      ];
    } else if (role == UserRole.supervisor) {
      cards = [
        metricCard('TOTAL QUEUE', total.toString(), Icons.analytics_outlined, Colors.blue),
        metricCard('UNRESOLVED', unresolved.toString(), Icons.pending_actions, Colors.orange),
        metricCard('ESCALATED TO ME', escalated.toString(), Icons.notifications_active, Colors.redAccent),
      ];
    } else {
      // Higher Authority gets SLA breach counters and escalations overrides
      cards = [
        metricCard('LEDGER TOTAL', total.toString(), Icons.dns_outlined, Colors.indigo),
        metricCard('SLA BREACHES', slaViolations.toString(), Icons.warning_amber, Colors.red),
        metricCard('PENDING ESCALATIONS', escalated.toString(), Icons.double_arrow, Colors.deepOrangeAccent),
      ];
    }

    return Container(
      color: const Color(0xFF1E293B).withOpacity(0.5),
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: Row(
        children: cards,
      ),
    );
  }

  Widget _buildFilterPanel({
    required List<String> statusOptions,
    required List<String> categoryOptions,
    required List<String> priorityOptions,
    required List<String> wardOptions,
    required List<String> engineerOptions,
    required bool hideEngineerFilter,
  }) {
    return Container(
      color: const Color(0xFF1E293B),
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          // Search Field
          TextField(
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Search by complaint ID, title, or locality/ward...',
              hintStyle: const TextStyle(color: Colors.slate, fontSize: 13),
              prefixIcon: const Icon(Icons.search, color: Colors.slate),
              filled: true,
              fillColor: const Color(0xFF0F172A),
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
            ),
            onChanged: (val) {
              setState(() {
                _searchQuery = val;
              });
            },
          ),
          const SizedBox(height: 8),

          // Dropdown filter row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterDropdown(
                  label: 'Status',
                  value: _selectedStatus,
                  items: statusOptions,
                  onChanged: (val) => setState(() => _selectedStatus = val!),
                ),
                _buildFilterDropdown(
                  label: 'Category',
                  value: _selectedCategory,
                  items: categoryOptions,
                  onChanged: (val) => setState(() => _selectedCategory = val!),
                ),
                _buildFilterDropdown(
                  label: 'Priority',
                  value: _selectedPriority,
                  items: priorityOptions,
                  onChanged: (val) => setState(() => _selectedPriority = val!),
                ),
                _buildFilterDropdown(
                  label: 'Ward',
                  value: _selectedWard,
                  items: wardOptions,
                  onChanged: (val) => setState(() => _selectedWard = val!),
                ),
                if (!hideEngineerFilter)
                  _buildFilterDropdown(
                    label: 'Engineer',
                    value: _selectedEngineer,
                    items: engineerOptions,
                    onChanged: (val) => setState(() => _selectedEngineer = val!),
                  ),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _searchQuery = '';
                      _selectedStatus = 'all';
                      _selectedCategory = 'all';
                      _selectedPriority = 'all';
                      _selectedWard = 'all';
                      _selectedEngineer = 'all';
                    });
                  },
                  child: const Text('Clear Filters', style: TextStyle(color: Colors.redAccent, fontSize: 11)),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildFilterDropdown({
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.slate.shade800, width: 0.8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$label: ',
            style: const TextStyle(color: Colors.slate, fontSize: 11, fontWeight: FontWeight.bold),
          ),
          DropdownButton<String>(
            value: value,
            dropdownColor: const Color(0xFF0F172A),
            underline: const SizedBox(),
            icon: const Icon(Icons.arrow_drop_down, color: Colors.slate, size: 16),
            style: const TextStyle(color: Colors.white, fontSize: 11),
            items: items.map((val) {
              return DropdownMenuItem<String>(
                value: val,
                child: Text(val.replaceAll('_', ' ').toUpperCase()),
              );
            }).toList(),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildQueueList({
    required List<Complaint> complaints,
    required String? selectedId,
    required ValueChanged<String> onSelect,
  }) {
    if (complaints.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox_outlined, size: 40, color: Colors.slate),
            SizedBox(height: 12),
            Text(
              'No complaints match current search/filters.',
              style: TextStyle(color: Colors.slate, fontSize: 13),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: complaints.length,
      padding: const EdgeInsets.all(12),
      itemBuilder: (context, index) {
        final c = complaints[index];
        final isSelected = c.id == selectedId;
        final formattedDate = DateFormat('dd MMM, hh:mm a').format(c.createdAt);
        final ageHours = DateTime.now().difference(c.createdAt).inHours;
        final isSlaBreached = ageHours > 48 && c.status != ComplaintStatus.closed && c.status != ComplaintStatus.resolved;

        return Card(
          color: isSelected ? const Color(0xFF1E293B) : const Color(0xFF1E293B).withOpacity(0.4),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(
              color: isSelected
                  ? Colors.emerald
                  : isSlaBreached
                      ? Colors.redAccent.withOpacity(0.5)
                      : Colors.slate.shade800,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          margin: const EdgeInsets.only(bottom: 8),
          child: InkWell(
            onTap: () => onSelect(c.id),
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Upper badging row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(_getCategoryIcon(c.category), color: Colors.emerald, size: 16),
                          const SizedBox(width: 6),
                          Text(
                            c.category.toUpperCase(),
                            style: const TextStyle(
                              color: Colors.emerald,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'JetBrains Mono',
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          if (isSlaBreached)
                            Container(
                              margin: const EdgeInsets.only(right: 6),
                              padding: const EdgeInsets.symmetric(horizontal: 6, py: 2),
                              decoration: BoxDecoration(
                                color: Colors.red.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.schedule, color: Colors.redAccent, size: 10),
                                  SizedBox(width: 4),
                                  Text(
                                    'SLA BREACH',
                                    style: TextStyle(color: Colors.redAccent, fontSize: 8, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, py: 2),
                            decoration: BoxDecoration(
                              color: _getStatusColor(c.status).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              c.status.name.replaceAll('underReview', 'under_review').replaceAll('inProgress', 'in_progress').replaceAll('awaitingCommunityConfirmation', 'awaiting_community_confirmation').toUpperCase(),
                              style: TextStyle(
                                color: _getStatusColor(c.status),
                                fontSize: 8,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'JetBrains Mono',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Title
                  Text(
                    c.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Location and Date
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined, color: Colors.slate, size: 12),
                          const SizedBox(width: 4),
                          Text(
                            '${c.location.locality}, Ward ${c.location.ward}',
                            style: const TextStyle(color: Colors.slate, fontSize: 11),
                          ),
                        ],
                      ),
                      Text(
                        formattedDate,
                        style: const TextStyle(color: Colors.slate, fontSize: 10, fontFamily: 'JetBrains Mono'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Bottom info: Priority & Assigned Engineer
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, py: 2),
                        decoration: BoxDecoration(
                          color: _getPriorityColor(c.priority).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${c.priority.name.toUpperCase()} PRIORITY',
                          style: TextStyle(
                            color: _getPriorityColor(c.priority),
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      Text(
                        c.assignedEngineerName != null && c.assignedEngineerName!.isNotEmpty
                            ? 'Assignee: ${c.assignedEngineerName}'
                            : 'UNASSIGNED',
                        style: TextStyle(
                          color: c.assignedEngineerName != null ? Colors.white70 : Colors.amber,
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _showDetailBottomSheet(BuildContext context, String complaintId, UserEntity user) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return FractionallySizedBox(
          heightFactor: 0.85,
          child: Consumer(
            builder: (context, ref, child) {
              final complaintsAsync = ref.watch(allComplaintsStreamProvider);
              return complaintsAsync.when(
                data: (allComplaints) {
                  final comp = allComplaints.firstWhere((c) => c.id == complaintId);
                  return _buildDetailPanel(comp, user);
                },
                loading: () => const Center(child: CircularProgressIndicator(color: Colors.emerald)),
                error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.redAccent))),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildDetailPanel(Complaint item, UserEntity user) {
    final formattedReported = DateFormat('dd MMM yyyy, hh:mm a').format(item.lifecycleTimeline.reportedAt);
    final ageHours = DateTime.now().difference(item.createdAt).inHours;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header / ID Title Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'TICKET ID: #${item.id.substring(0, 8).toUpperCase()}',
                style: const TextStyle(
                  color: Colors.slate,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'JetBrains Mono',
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, color: Colors.slate),
                onPressed: () {
                  setState(() {
                    _selectedComplaintId = null;
                  });
                  if (Navigator.canPop(context)) Navigator.pop(context);
                },
              ),
            ],
          ),

          // Title
          Text(
            item.title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),

          // Metadata pills
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, py: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(item.status).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'STATUS: ${item.status.name.replaceAll('underReview', 'under_review').replaceAll('inProgress', 'in_progress').replaceAll('awaitingCommunityConfirmation', 'awaiting_community_confirmation').toUpperCase()}',
                  style: TextStyle(
                    color: _getStatusColor(item.status),
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'JetBrains Mono',
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, py: 4),
                decoration: BoxDecoration(
                  color: _getPriorityColor(item.priority).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'PRIORITY: ${item.priority.name.toUpperCase()}',
                  style: TextStyle(
                    color: _getPriorityColor(item.priority),
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'JetBrains Mono',
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, py: 4),
                decoration: BoxDecoration(
                  color: Colors.emerald.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'SEVERITY: ${item.severityScore}%',
                  style: const TextStyle(
                    color: Colors.emerald,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'JetBrains Mono',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Location details card
          _buildDetailCard(
            title: 'LOCATION & GEODATA',
            icon: Icons.map,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${item.location.locality}, Ward ${item.location.ward}',
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  'District: ${item.location.district}, State: ${item.location.state}',
                  style: const TextStyle(color: Colors.slate, fontSize: 12),
                ),
                const SizedBox(height: 4),
                Text(
                  'Geohash: ${item.location.geohash} | Coord: [${item.location.latitude.toStringAsFixed(5)}, ${item.location.longitude.toStringAsFixed(5)}]',
                  style: const TextStyle(color: Colors.slate, fontSize: 11, fontFamily: 'JetBrains Mono'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Description Card
          _buildDetailCard(
            title: 'DESCRIPTION',
            icon: Icons.notes,
            child: Text(
              item.description,
              style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
            ),
          ),
          const SizedBox(height: 12),

          // Work Assignment status
          _buildDetailCard(
            title: 'OPERATIONAL TEAM ASSIGNMENT',
            icon: Icons.engineering,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Assigned Engineer:', style: TextStyle(color: Colors.slate, fontSize: 12)),
                    Text(
                      item.assignedEngineerName ?? 'UNASSIGNED',
                      style: TextStyle(
                        color: item.assignedEngineerName != null ? Colors.emerald : Colors.amber,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                if (item.workNotes != null && item.workNotes!.isNotEmpty) ...[
                  const Divider(color: Color(0xFF334155), height: 16),
                  const Text('Engineer Active Notes:', style: TextStyle(color: Colors.slate, fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(
                    item.workNotes!,
                    style: const TextStyle(color: Colors.white70, fontSize: 12, fontStyle: FontStyle.italic),
                  ),
                ],
                if (item.rejectionReason != null && item.rejectionReason!.isNotEmpty) ...[
                  const Divider(color: Color(0xFF334155), height: 16),
                  const Text('Prior Assignment Rejection Reason:', style: TextStyle(color: Colors.redAccent, fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(
                    item.rejectionReason!,
                    style: const TextStyle(color: Colors.redAccent, fontSize: 12, fontStyle: FontStyle.italic),
                  ),
                ],
                if (item.escalationReason != null && item.escalationReason!.isNotEmpty) ...[
                  const Divider(color: Color(0xFF334155), height: 16),
                  const Text('Escalation Request Reason:', style: TextStyle(color: Colors.amber, fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(
                    item.escalationReason!,
                    style: const TextStyle(color: Colors.amber, fontSize: 12, fontStyle: FontStyle.italic),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Before & After completion evidence
          if (item.media.isNotEmpty || item.completionPhotoUrl != null) ...[
            _buildDetailCard(
              title: 'RESOLUTION EVIDENCE & ASSETS',
              icon: Icons.photo_library,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (item.media.isNotEmpty) ...[
                    const Text('Citizen Evidence (Before):', style: TextStyle(color: Colors.slate, fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    SizedBox(
                      height: 100,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: item.media.length,
                        itemBuilder: (context, i) {
                          return Container(
                            margin: const EdgeInsets.only(right: 8),
                            width: 130,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(6),
                              image: DecorationImage(
                                image: NetworkImage(item.media[i].url),
                                fit: BoxFit.cover,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                  if (item.completionPhotoUrl != null && item.completionPhotoUrl!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    const Text('Engineer Correction (After):', style: TextStyle(color: Colors.emerald, fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Container(
                      height: 150,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.emerald, width: 1.5),
                        image: DecorationImage(
                          image: NetworkImage(item.completionPhotoUrl!),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ],
                  if (item.resolutionNotes != null && item.resolutionNotes!.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    const Text('Resolution/Closure Summary:', style: TextStyle(color: Colors.slate, fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(
                      item.resolutionNotes!,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ]
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // SLA & Timeline Logs Card
          _buildDetailCard(
            title: 'SLA COMPLIANCE TIMELINE',
            icon: Icons.watch_later_outlined,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildTimelineTile('Ticket Logged', formattedReported, true),
                _buildTimelineTile(
                  'Dispatched to Field',
                  item.lifecycleTimeline.assignedAt != null
                      ? DateFormat('dd MMM yyyy, hh:mm a').format(item.lifecycleTimeline.assignedAt!)
                      : 'Pending dispatch review',
                  item.lifecycleTimeline.assignedAt != null,
                ),
                _buildTimelineTile(
                  'Work Completed',
                  item.lifecycleTimeline.resolvedAt != null
                      ? DateFormat('dd MMM yyyy, hh:mm a').format(item.lifecycleTimeline.resolvedAt!)
                      : 'In progress',
                  item.lifecycleTimeline.resolvedAt != null,
                ),
                _buildTimelineTile(
                  'Archived / Closed',
                  item.lifecycleTimeline.closedAt != null
                      ? DateFormat('dd MMM yyyy, hh:mm a').format(item.lifecycleTimeline.closedAt!)
                      : 'Awaiting citizen approval',
                  item.lifecycleTimeline.closedAt != null,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // ROLE-BASED ACCESS CONTROL PORTAL WORKFLOW ACTIONS
          const Text(
            'ROLE-BASED WORKFLOW PORTAL',
            style: TextStyle(
              color: Colors.emerald,
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.1,
              fontFamily: 'JetBrains Mono',
            ),
          ),
          const SizedBox(height: 8),

          _isActionLoading
              ? const Center(child: Padding(padding: EdgeInsets.all(16.0), child: CircularProgressIndicator(color: Colors.emerald)))
              : _buildRoleActions(item, user),
        ],
      ),
    );
  }

  Widget _buildTimelineTile(String event, String dateStr, bool active) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(
            active ? Icons.check_circle : Icons.radio_button_off,
            color: active ? Colors.green : Colors.slate,
            size: 16,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  event,
                  style: TextStyle(
                    color: active ? Colors.white70 : Colors.slate,
                    fontSize: 12,
                    fontWeight: active ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                Text(
                  dateStr,
                  style: const TextStyle(color: Colors.slate, fontSize: 10, fontFamily: 'JetBrains Mono'),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildDetailCard({required String title, required IconData icon, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.slate.shade800, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: Colors.emerald, size: 16),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.slate,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                  fontFamily: 'JetBrains Mono',
                ),
              ),
            ],
          ),
          const Divider(color: Color(0xFF334155), height: 16),
          child,
        ],
      ),
    );
  }

  // Route actions dynamically based on the active role of user
  Widget _buildRoleActions(Complaint item, UserEntity user) {
    if (user.role == UserRole.fieldEngineer) {
      return _buildFieldEngineerActions(item, user);
    } else if (user.role == UserRole.supervisor) {
      return _buildSupervisorActions(item, user);
    } else if (user.role == UserRole.higherAuthority) {
      return _buildHigherAuthorityActions(item, user);
    }
    return const SizedBox();
  }

  // --- 1. FIELD ENGINEER WORKFLOW ---
  Widget _buildFieldEngineerActions(Complaint item, UserEntity user) {
    // Restrictions: Can only act on complaints assigned to them specifically
    if (item.assignedEngineerId != user.uid) {
      return const Text(
        'Warning: This ticket is not assigned to your workforce card.',
        style: TextStyle(color: Colors.amber, fontSize: 12, fontWeight: FontWeight.bold),
      );
    }

    if (item.status == ComplaintStatus.assigned) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Assignment Request Pending',
            style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.indigo,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: const Icon(Icons.check),
                  label: const Text('Accept Duty'),
                  onPressed: () => _updateStatusAndPublish(
                    item.copyWith(
                      status: ComplaintStatus.accepted,
                      workNotes: 'Task assignment accepted by Field Engineer Ravi Kumar.',
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.redAccent,
                    side: const BorderSide(color: Colors.redAccent),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: const Icon(Icons.cancel_outlined),
                  label: const Text('Reject'),
                  onPressed: () {
                    _showReasonDialog(
                      title: 'Reject Task Assignment',
                      hintText: 'Provide a critical rejection reason to dispatcher...',
                      onConfirm: (reason) {
                        _updateStatusAndPublish(
                          item.copyWith(
                            status: ComplaintStatus.underReview,
                            assignedEngineerId: '',
                            assignedEngineerName: '',
                            rejectionReason: reason,
                            workNotes: 'Task rejected. Reason: $reason',
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ],
      );
    }

    if (item.status == ComplaintStatus.accepted) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.amber,
              foregroundColor: Colors.black,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            icon: const Icon(Icons.play_arrow),
            label: const Text('Initialize & Start Field Work'),
            onPressed: () => _updateStatusAndPublish(
              item.copyWith(
                status: ComplaintStatus.inProgress,
                workNotes: 'Field Engineer Ravi Kumar has reached location and started correction works.',
              ),
            ),
          ),
          const SizedBox(height: 10),
          // Interactive Map navigation simulator
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.emerald,
              side: const BorderSide(color: Colors.emerald),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            icon: const Icon(Icons.navigation_outlined),
            label: const Text('Launch Navigation coordinates'),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  backgroundColor: Colors.emerald.shade900,
                  content: Text('Simulating route path tracking to geohash ${item.location.geohash} [Accuracy: ${item.location.accuracy}m]'),
                ),
              );
            },
          ),
        ],
      );
    }

    if (item.status == ComplaintStatus.inProgress) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Record Evidence & Resolution',
            style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          
          // Select mock after photo url
          const Text('Select After Correction Photo:', style: TextStyle(color: Colors.slate, fontSize: 11)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            children: _mockPhotos.map((p) {
              final isSel = _selectedMockPhotoUrl == p['url'];
              return ChoiceChip(
                label: Text(p['name']!),
                selected: isSel,
                selectedColor: Colors.emerald.shade900,
                backgroundColor: const Color(0xFF0F172A),
                labelStyle: TextStyle(color: isSel ? Colors.emerald : Colors.slate, fontSize: 11),
                onSelected: (sel) {
                  setState(() {
                    _selectedMockPhotoUrl = sel ? p['url'] : null;
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 12),

          // Work notes
          TextField(
            controller: _notesController,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            maxLines: 2,
            decoration: InputDecoration(
              labelText: 'Work Notes & Material Log',
              labelStyle: const TextStyle(color: Colors.slate, fontSize: 12),
              filled: true,
              fillColor: const Color(0xFF0F172A),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Colors.emerald)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.slate.shade800)),
            ),
          ),
          const SizedBox(height: 12),

          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            icon: const Icon(Icons.check_circle_outline),
            label: const Text('Mark Correction Completed'),
            onPressed: () {
              if (_selectedMockPhotoUrl == null) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Verification error: Correction photo evidence is required to finalize SLA.')),
                );
                return;
              }
              final notes = _notesController.text.isNotEmpty ? _notesController.text : 'Municipal correction works completed successfully. Before and after photos attached.';
              _updateStatusAndPublish(
                item.copyWith(
                  status: ComplaintStatus.resolved,
                  completionPhotoUrl: _selectedMockPhotoUrl,
                  resolutionNotes: notes,
                  workNotes: notes,
                  lifecycleTimeline: ComplaintTimeline(
                    reportedAt: item.lifecycleTimeline.reportedAt,
                    assignedAt: item.lifecycleTimeline.assignedAt,
                    resolvedAt: DateTime.now(),
                  ),
                ),
              );
            },
          ),
        ],
      );
    }

    return const Text(
      'Work completed. Resolution awaits audit validation or citizen feedback.',
      style: TextStyle(color: Colors.emerald, fontSize: 12, fontWeight: FontWeight.bold),
    );
  }

  // --- 2. SUPERVISOR WORKFLOW ---
  Widget _buildSupervisorActions(Complaint item, UserEntity user) {
    // State transitions: Assign complaints to engineers, review engineer submissions, escalate
    final canAssign = item.status == ComplaintStatus.submitted ||
        item.status == ComplaintStatus.underReview ||
        item.status == ComplaintStatus.reopened;

    if (canAssign) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Dispatch Duty Work Order', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          
          // Select engineer from dropdown list
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.slate.shade800),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedEngineerIdForAssignment,
                hint: const Text('Choose Field Engineer...', style: TextStyle(color: Colors.slate, fontSize: 13)),
                dropdownColor: const Color(0xFF0F172A),
                style: const TextStyle(color: Colors.white, fontSize: 13),
                items: _mockEngineers.map((e) {
                  return DropdownMenuItem<String>(
                    value: e['id'],
                    child: Text('${e['name']} (${e['dept']})'),
                  );
                }).toList(),
                onChanged: (val) {
                  setState(() {
                    _selectedEngineerIdForAssignment = val;
                  });
                },
              ),
            ),
          ),
          const SizedBox(height: 10),

          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.emerald,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            icon: const Icon(Icons.send_rounded),
            label: const Text('Dispatch Task Order'),
            onPressed: () {
              if (_selectedEngineerIdForAssignment == null) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please select an authorized engineer first.')),
                );
                return;
              }
              final selectedEng = _mockEngineers.firstWhere((e) => e['id'] == _selectedEngineerIdForAssignment);
              _updateStatusAndPublish(
                item.copyWith(
                  status: ComplaintStatus.assigned,
                  assignedEngineerId: selectedEng['id'] == 'eng_01' ? 'dev_mock_engineer_uid_88' : selectedEng['id'], // map to simulated engineer UID
                  assignedEngineerName: selectedEng['name'],
                  lifecycleTimeline: ComplaintTimeline(
                    reportedAt: item.lifecycleTimeline.reportedAt,
                    assignedAt: DateTime.now(),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 12),
          
          // Escalate button
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.redAccent,
              side: const BorderSide(color: Colors.redAccent),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            icon: const Icon(Icons.warning_amber),
            label: const Text('Escalate to Higher Authority'),
            onPressed: () {
              _showReasonDialog(
                title: 'Escalate Complaint',
                hintText: 'Provide critical escalation criteria (SLA risk, material shortage, political sensitivity)...',
                onConfirm: (reason) {
                  _updateStatusAndPublish(
                    item.copyWith(
                      status: ComplaintStatus.escalated,
                      escalationReason: reason,
                      workNotes: 'Escalated by supervisor. Reason: $reason',
                    ),
                  );
                },
              );
            },
          ),
        ],
      );
    }

    if (item.status == ComplaintStatus.resolved) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Auditor Approval Panel (Verify Corrections)',
            style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: const Icon(Icons.thumb_up_alt_outlined),
                  label: const Text('Approve & Close'),
                  onPressed: () => _updateStatusAndPublish(
                    item.copyWith(
                      status: ComplaintStatus.closed,
                      lifecycleTimeline: ComplaintTimeline(
                        reportedAt: item.lifecycleTimeline.reportedAt,
                        assignedAt: item.lifecycleTimeline.assignedAt,
                        resolvedAt: item.lifecycleTimeline.resolvedAt,
                        closedAt: DateTime.now(),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.redAccent,
                    side: const BorderSide(color: Colors.redAccent),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: const Icon(Icons.assignment_return_outlined),
                  label: const Text('Reject correction'),
                  onPressed: () {
                    _showReasonDialog(
                      title: 'Reject Correction Work',
                      hintText: 'Detail why the correction works failed inspection...',
                      onConfirm: (reason) {
                        _updateStatusAndPublish(
                          item.copyWith(
                            status: ComplaintStatus.inProgress,
                            rejectionReason: reason,
                            workNotes: 'Audit failed: $reason. Returned for rework.',
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ],
      );
    }

    // Allow re-assignment/re-dispatch even during progress
    if (item.status == ComplaintStatus.assigned || item.status == ComplaintStatus.accepted || item.status == ComplaintStatus.inProgress) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Re-assign / Override Active Ticket', style: TextStyle(color: Colors.slate, fontSize: 11, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.slate.shade800),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedEngineerIdForAssignment,
                      hint: const Text('Reassign Engineer...', style: TextStyle(color: Colors.slate, fontSize: 12)),
                      dropdownColor: const Color(0xFF0F172A),
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      items: _mockEngineers.map((e) {
                        return DropdownMenuItem<String>(
                          value: e['id'],
                          child: Text(e['name']!),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedEngineerIdForAssignment = val;
                        });
                      },
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.amber,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
                onPressed: () {
                  if (_selectedEngineerIdForAssignment == null) return;
                  final selectedEng = _mockEngineers.firstWhere((e) => e['id'] == _selectedEngineerIdForAssignment);
                  _updateStatusAndPublish(
                    item.copyWith(
                      status: ComplaintStatus.assigned,
                      assignedEngineerId: selectedEng['id'] == 'eng_01' ? 'dev_mock_engineer_uid_88' : selectedEng['id'],
                      assignedEngineerName: selectedEng['name'],
                      workNotes: 'Reassigned to ${selectedEng['name']} by supervisor.',
                    ),
                  );
                },
                child: const Text('Reassign', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              )
            ],
          ),
        ],
      );
    }

    return const Text(
      'Operational status finalized. Community auditing active.',
      style: TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold),
    );
  }

  // --- 3. HIGHER AUTHORITY WORKFLOW ---
  Widget _buildHigherAuthorityActions(Complaint item, UserEntity user) {
    // Override assignments, approve escalations
    final canOverride = item.status != ComplaintStatus.closed;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (item.status == ComplaintStatus.escalated) ...[
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.1),
              border: Border.all(color: Colors.redAccent, width: 1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.gavel, color: Colors.redAccent, size: 16),
                    SizedBox(width: 8),
                    Text(
                      'HIGH AUDIT ESCALATION DECISION REQUIRED',
                      style: TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'JetBrains Mono'),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Escalation reason:\n${item.escalationReason ?? "None provided"}',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
                        onPressed: () => _updateStatusAndPublish(
                          item.copyWith(
                            status: ComplaintStatus.underReview,
                            severityScore: 100, // force max severity
                            priority: ComplaintPriority.critical, // force max priority
                            escalationReason: '${item.escalationReason} | Escalation APPROVED. Priority escalated to critical.',
                          ),
                        ),
                        child: const Text('Approve & Elevate Priority', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white70,
                          side: const BorderSide(color: Colors.white30),
                        ),
                        onPressed: () => _updateStatusAndPublish(
                          item.copyWith(
                            status: ComplaintStatus.underReview,
                            escalationReason: '${item.escalationReason} | Escalation resolved / declined.',
                          ),
                        ),
                        child: const Text('Dismiss Escalation', style: TextStyle(fontSize: 11)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],

        if (canOverride) ...[
          const Text('Executive Executive Directive (Override Assignment)', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.slate.shade800),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedEngineerIdForAssignment,
                      hint: const Text('Override Assignee...', style: TextStyle(color: Colors.slate, fontSize: 12)),
                      dropdownColor: const Color(0xFF0F172A),
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      items: _mockEngineers.map((e) {
                        return DropdownMenuItem<String>(
                          value: e['id'],
                          child: Text(e['name']!),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedEngineerIdForAssignment = val;
                        });
                      },
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.redAccent,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
                onPressed: () {
                  if (_selectedEngineerIdForAssignment == null) return;
                  final selectedEng = _mockEngineers.firstWhere((e) => e['id'] == _selectedEngineerIdForAssignment);
                  _updateStatusAndPublish(
                    item.copyWith(
                      status: ComplaintStatus.assigned,
                      assignedEngineerId: selectedEng['id'] == 'eng_01' ? 'dev_mock_engineer_uid_88' : selectedEng['id'],
                      assignedEngineerName: selectedEng['name'],
                      workNotes: 'Executive override: Ticket forcefully assigned to ${selectedEng['name']} by Executive Authority.',
                    ),
                  );
                },
                child: const Text('OVERRIDE', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'JetBrains Mono')),
              )
            ],
          ),
        ],
      ],
    );
  }

  void _showReasonDialog({
    required String title,
    required String hintText,
    required ValueChanged<String> onConfirm,
  }) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          content: TextField(
            controller: _reasonController,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            maxLines: 3,
            decoration: InputDecoration(
              hintText: hintText,
              hintStyle: const TextStyle(color: Colors.slate, fontSize: 12),
              filled: true,
              fillColor: const Color(0xFF0F172A),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: Colors.slate)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.emerald, foregroundColor: Colors.white),
              onPressed: () {
                if (_reasonController.text.trim().isEmpty) return;
                final txt = _reasonController.text.trim();
                _reasonController.clear();
                Navigator.pop(context);
                onConfirm(txt);
              },
              child: const Text('Confirm'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _updateStatusAndPublish(Complaint updated) async {
    setState(() {
      _isActionLoading = true;
    });

    final repo = ref.read(issueRepositoryProvider);
    final res = await repo.updateComplaint(updated);

    if (mounted) {
      setState(() {
        _isActionLoading = false;
      });

      res.fold(
        (failure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: failure.message.contains('Offline queue') ? Colors.amber.shade900 : Colors.redAccent.shade700,
              content: Text(failure.message),
            ),
          );
        },
        (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Colors.green,
              content: Text('Workflow transit executed successfully in FireStore.'),
            ),
          );
        },
      );
    }
  }
}
