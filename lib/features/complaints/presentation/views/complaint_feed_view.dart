import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/complaint.dart';
import '../providers/complaints_providers.dart';
import 'complaint_detail_view.dart';
import 'package:intl/intl.dart';

class ComplaintFeedView extends ConsumerStatefulWidget {
  const ComplaintFeedView({super.key});

  @override
  ConsumerState<ComplaintFeedView> createState() => _ComplaintFeedViewState();
}

class _ComplaintFeedViewState extends ConsumerState<ComplaintFeedView> {
  String _selectedCategory = 'all'; // all, roads, water, sanitation, lighting, safety
  bool _showOnlyMine = true; // My History vs Community Feed

  final List<String> _categories = ['all', 'roads', 'water', 'sanitation', 'lighting', 'safety'];

  Color _getStatusColor(ComplaintStatus s) {
    switch (s) {
      case ComplaintStatus.submitted:
        return Colors.blue;
      case ComplaintStatus.underReview:
        return Colors.purple;
      case ComplaintStatus.assigned:
        return Colors.cyan;
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
    final offlineCount = ref.watch(offlineQueueCountProvider);

    // Watch stream provider according to selection
    final userId = 'citizen_user_current'; // Authenticated simulated user ID
    final complaintsAsync = _showOnlyMine
        ? ref.watch(userComplaintsStreamProvider(userId))
        : ref.watch(allComplaintsStreamProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Civic Issue Ledger'),
        backgroundColor: const Color(0xFF0F172A),
        actions: [
          // Offline / Online Status Indicator
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, py: 4),
            decoration: BoxDecoration(
              color: isOnline ? Colors.green.withOpacity(0.1) : Colors.amber.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isOnline ? Colors.green : Colors.amber,
                width: 0.8,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
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
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Sync alert for offline pending tickets
          if (offlineCount > 0)
            Container(
              color: Colors.amber.shade900.withOpacity(0.2),
              padding: const EdgeInsets.symmetric(horizontal: 16, py: 10),
              child: Row(
                children: [
                  const Icon(Icons.cloud_upload_outlined, color: Colors.amber, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'You have $offlineCount pending report(s) cached locally.',
                      style: const TextStyle(fontSize: 12, color: Colors.amber, fontWeight: FontWeight.bold),
                    ),
                  ),
                  if (isOnline)
                    TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: Colors.amber,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(horizontal: 12, py: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: () {
                        ref.read(complaintSubmitNotifierProvider.notifier).syncOffline();
                      },
                      child: const Text('Sync Now', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                ],
              ),
            ),

          // Segment control (My Reports vs All Community Reports)
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.all(4),
              child: Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _showOnlyMine = true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _showOnlyMine ? const Color(0xFF0F172A) : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Center(
                          child: Text(
                            'My History',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: _showOnlyMine ? Colors.emerald : Colors.white70,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _showOnlyMine = false),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: !_showOnlyMine ? const Color(0xFF0F172A) : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Center(
                          child: Text(
                            'Community Feed',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: !_showOnlyMine ? Colors.emerald : Colors.white70,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Horizontal Category Filter List
          SizedBox(
            height: 40,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              scrollDirection: Axis.horizontal,
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, idx) {
                final cat = _categories[idx];
                final isSelected = _selectedCategory == cat;
                return InkWell(
                  onTap: () => setState(() => _selectedCategory = cat),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.emerald.withOpacity(0.15) : const Color(0xFF131C33),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected ? Colors.emerald : Colors.white10,
                        width: 0.8,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        cat.toUpperCase(),
                        style: TextStyle(
                          color: isSelected ? Colors.emerald : Colors.white60,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'JetBrains Mono',
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),

          // Scrollable Feed List
          Expanded(
            child: complaintsAsync.when(
              data: (list) {
                // Apply frontend filtering for Category
                final filtered = _selectedCategory == 'all'
                    ? list
                    : list.where((c) => c.category.toLowerCase() == _selectedCategory.toLowerCase()).toList();

                if (filtered.isEmpty) {
                  return _buildEmptyState();
                }

                return RefreshIndicator(
                  color: Colors.emerald,
                  backgroundColor: const Color(0xFF0F172A),
                  onRefresh: () async {
                    // Pull to refresh action: triggers ref refreshing
                    ref.invalidate(_showOnlyMine 
                        ? userComplaintsStreamProvider(userId) 
                        : allComplaintsStreamProvider);
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, idx) {
                      final item = filtered[idx];
                      return _buildComplaintCard(context, item);
                    },
                  ),
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(color: Colors.emerald),
              ),
              error: (err, stack) => _buildErrorState(err.toString()),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.assignment_turned_in_outlined, size: 48, color: Colors.slate.shade600),
          const SizedBox(height: 12),
          Text(
            'No issues registered',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.slate.shade300, fontSize: 16),
          ),
          const SizedBox(height: 4),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              'All clear! Use the reporter widget to lodge new civic problems.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
            const SizedBox(height: 12),
            const Text(
              'Synchronization Error',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16),
            ),
            const SizedBox(height: 4),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey, fontSize: 12),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                ref.invalidate(_showOnlyMine 
                    ? userComplaintsStreamProvider('citizen_user_current') 
                    : allComplaintsStreamProvider);
              },
              child: const Text('Retry Feed Loading'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildComplaintCard(BuildContext context, Complaint item) {
    final statusColor = _getStatusColor(item.status);
    final formattedDate = DateFormat('MMM dd, yyyy HH:mm').format(item.createdAt);

    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ComplaintDetailView(complaint: item),
          ),
        );
      },
      child: Card(
        color: const Color(0xFF0F172A),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Colors.white10),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header Row: Category icon, Category text, Status Badge
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.emerald.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _getCategoryIcon(item.category),
                      size: 16,
                      color: Colors.emerald,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    item.category.toUpperCase(),
                    style: const TextStyle(
                      fontFamily: 'JetBrains Mono',
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.emerald,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, py: 3),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.12),
                      border: Border.all(color: statusColor, width: 0.6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      item.status.name.toUpperCase(),
                      style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 8),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Title
              Text(
                item.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 4),

              // Description Snippet
              Text(
                item.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12, color: Colors.white60),
              ),
              const SizedBox(height: 12),

              const Divider(color: Colors.white12, height: 1),
              const SizedBox(height: 12),

              // Footer row: geohash, reported time, attachments count
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 12, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        'Grid: ${item.location.geohash}',
                        style: const TextStyle(
                          fontSize: 10,
                          color: Colors.grey,
                          fontFamily: 'JetBrains Mono',
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      if (item.media.isNotEmpty) ...[
                        const Icon(Icons.attach_file, size: 12, color: Colors.emerald),
                        Text(
                          '${item.media.length}',
                          style: const TextStyle(fontSize: 10, color: Colors.emerald, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 12),
                      ],
                      const Icon(Icons.access_time, size: 12, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        formattedDate,
                        style: const TextStyle(fontSize: 9, color: Colors.grey),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
