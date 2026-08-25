import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/notification_service.dart';

class NotificationsModal extends StatefulWidget {
  const NotificationsModal({super.key});

  static Future<void> show(BuildContext context) async {
    Feedback.forTap(context);
    NotificationService().fetchNotifications();

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const NotificationsModal(),
    );
  }

  @override
  State<NotificationsModal> createState() => _NotificationsModalState();
}

class _NotificationsModalState extends State<NotificationsModal> {
  final NotificationService _service = NotificationService();
  String _selectedFilter = 'All';

  @override
  void initState() {
    super.initState();
    _service.addListener(_onServiceUpdate);
    _service.fetchNotifications();
  }

  @override
  void dispose() {
    _service.removeListener(_onServiceUpdate);
    super.dispose();
  }

  void _onServiceUpdate() {
    if (mounted) setState(() {});
  }

  Future<void> _deleteNotification(String id) async {
    Feedback.forTap(context);
    try {
      await ApiService.delete('/notifications/$id');
      await _service.fetchNotifications();
    } catch (e) {
      debugPrint('[Notifications] Delete error: $e');
    }
  }

  bool get _isTeacher => AuthService.currentUser?.role == 'teacher';

  List<String> get _filterCategories => const ['All', 'Unread', 'Assessments', 'Activities'];

  List<AppNotification> get _filteredNotifications {
    final list = _service.notifications;
    if (_selectedFilter == 'Unread') {
      return list.where((n) => !n.isRead).toList();
    }
    if (_selectedFilter == 'Assessments') {
      return list.where((n) {
        final type = n.notificationType.toLowerCase();
        final title = n.title.toLowerCase();
        return type == 'assessment' || type == 'reading_level' || type == 'phil_iri' || title.contains('assessment');
      }).toList();
    }
    if (_selectedFilter == 'Activities') {
      return list.where((n) {
        final type = n.notificationType.toLowerCase();
        final title = n.title.toLowerCase();
        return type == 'activity' || type == 'practice' || type == 'submission' || title.contains('activity') || title.contains('challenge');
      }).toList();
    }
    return list;
  }

  Widget _buildIconForType(String typeStr, String titleStr) {
    final type = typeStr.toLowerCase();
    final title = titleStr.toLowerCase();

    if (title.contains('alert') || title.contains('frustration') || title.contains('low')) {
      return Container(
        width: 36,
        height: 36,
        decoration: const BoxDecoration(
          color: Color(0xFFFEE2E2),
          shape: BoxShape.circle,
        ),
        child: const Center(
          child: Iconify(
            Ph.warning_bold,
            color: Color(0xFFEF4444),
            size: 18,
          ),
        ),
      );
    }
    if (type == 'assessment' || type == 'reading_level' || type == 'phil_iri') {
      return Container(
        width: 36,
        height: 36,
        decoration: const BoxDecoration(
          color: Color(0xFFEFF6FF),
          shape: BoxShape.circle,
        ),
        child: const Center(
          child: Iconify(
            PhIcons.userSoundBold,
            color: Color(0xFF1B64D8),
            size: 18,
          ),
        ),
      );
    }
    if (type == 'activity' || type == 'practice' || type == 'submission') {
      return Container(
        width: 36,
        height: 36,
        decoration: const BoxDecoration(
          color: Color(0xFFD1FAE5),
          shape: BoxShape.circle,
        ),
        child: const Center(
          child: Iconify(
            PhIcons.flagPennantBold,
            color: Color(0xFF059669),
            size: 18,
          ),
        ),
      );
    }
    if (type == 'announcement' || type == 'general') {
      return Container(
        width: 36,
        height: 36,
        decoration: const BoxDecoration(
          color: Color(0xFFFEF3C7),
          shape: BoxShape.circle,
        ),
        child: const Center(
          child: Iconify(
            PhIcons.earBold,
            color: Color(0xFFD97706),
            size: 18,
          ),
        ),
      );
    }
    return Container(
      width: 36,
      height: 36,
      decoration: const BoxDecoration(
        color: Color(0xFFF1F5F9),
        shape: BoxShape.circle,
      ),
      child: const Center(
        child: Iconify(
          Ph.bell,
          color: Color(0xFF475569),
          size: 18,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final brandColor = _isTeacher ? const Color(0xFFD34426) : const Color(0xFF1B64D8);
    final unreadCardBg = _isTeacher ? const Color(0xFFFFF5F3) : const Color(0xFFF0F6FF);
    final unreadCardBorder = _isTeacher ? const Color(0xFFFECDD3) : const Color(0xFFBFDBFE);

    final displayedList = _filteredNotifications;
    final unreadCount = _service.unreadCount;
    final isLoading = _service.isLoading;

    return Container(
      height: MediaQuery.of(context).size.height * 0.82,
      decoration: const BoxDecoration(
        color: Color(0xFFFCFAF7),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag Handle
          const SizedBox(height: 12),
          Center(
            child: Container(
              width: 38,
              height: 5,
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Header Row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isTeacher ? 'Teacher Notifications' : 'Notifications & Alerts',
                        style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0F172A),
                          letterSpacing: -0.4,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$unreadCount Unread Notifications',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: brandColor,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: unreadCount > 0 ? () => _service.markAllAsRead() : null,
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  icon: Iconify(Ph.check, size: 14, color: brandColor),
                  label: Text(
                    'Mark Read',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: brandColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Filter Chips Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
            child: Row(
              children: _filterCategories.map((cat) {
                final isSelected = _selectedFilter == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ChoiceChip(
                    label: Text(
                      cat,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? Colors.white : const Color(0xFF475569),
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: brandColor,
                    backgroundColor: Colors.white,
                    side: BorderSide(
                      color: isSelected ? brandColor : const Color(0xFFE2E8F0),
                    ),
                    onSelected: (val) {
                      if (val) {
                        setState(() {
                          _selectedFilter = cat;
                        });
                      }
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          const Divider(height: 24, color: Color(0xFFE2E8F0)),

          // Content List
          Expanded(
            child: isLoading && _service.notifications.isEmpty
                ? Center(
                    child: CircularProgressIndicator(color: brandColor),
                  )
                : displayedList.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Iconify(Ph.bell, size: 48, color: const Color(0xFF94A3B8)),
                            const SizedBox(height: 12),
                            Text(
                              'No Notifications Found',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF1E293B),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'You have no activity alerts matching your selected filter.',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () => _service.fetchNotifications(),
                        color: brandColor,
                        child: ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                          itemCount: displayedList.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final n = displayedList[index];

                            return InkWell(
                              onTap: () {
                                if (!n.isRead) {
                                  _service.markAsRead(n.id);
                                }
                              },
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: n.isRead ? Colors.white : unreadCardBg,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: n.isRead ? const Color(0xFFE2E8F0) : unreadCardBorder,
                                    width: 1.2,
                                  ),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    _buildIconForType(n.notificationType, n.title),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  n.title,
                                                  style: GoogleFonts.inter(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.w700,
                                                    color: const Color(0xFF0F172A),
                                                  ),
                                                ),
                                              ),
                                              if (!n.isRead) ...[
                                                Container(
                                                  width: 8,
                                                  height: 8,
                                                  decoration: const BoxDecoration(
                                                    color: Color(0xFFEF4444),
                                                    shape: BoxShape.circle,
                                                  ),
                                                ),
                                                const SizedBox(width: 6),
                                              ],
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFF1F5F9),
                                                  borderRadius: BorderRadius.circular(4),
                                                ),
                                                child: Text(
                                                  n.notificationType.toUpperCase(),
                                                  style: GoogleFonts.inter(
                                                    fontSize: 9,
                                                    fontWeight: FontWeight.w700,
                                                    color: const Color(0xFF64748B),
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            n.message,
                                            style: GoogleFonts.inter(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w400,
                                              color: const Color(0xFF334155),
                                              height: 1.35,
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                n.timeAgo,
                                                style: GoogleFonts.inter(
                                                  fontSize: 11,
                                                  color: const Color(0xFF94A3B8),
                                                ),
                                              ),
                                              GestureDetector(
                                                onTap: () => _deleteNotification(n.id),
                                                child: const Iconify(
                                                  Ph.trash,
                                                  size: 16,
                                                  color: Color(0xFF94A3B8),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
