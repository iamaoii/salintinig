import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/services/notification_service.dart';

class NotificationCenterModal extends StatefulWidget {
  const NotificationCenterModal({super.key});

  static Future<void> show(BuildContext context) async {
    Feedback.forTap(context);
    // Fetch latest notifications on open
    NotificationService().fetchNotifications();

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => const NotificationCenterModal(),
    );
  }

  @override
  State<NotificationCenterModal> createState() => _NotificationCenterModalState();
}

class _NotificationCenterModalState extends State<NotificationCenterModal> {
  final NotificationService _service = NotificationService();

  @override
  void initState() {
    super.initState();
    _service.addListener(_onServiceUpdate);
  }

  @override
  void dispose() {
    _service.removeListener(_onServiceUpdate);
    super.dispose();
  }

  void _onServiceUpdate() {
    if (mounted) setState(() {});
  }

  IconData _getNotificationIcon(String type, String title) {
    final t = '${type.toLowerCase()} ${title.toLowerCase()}';
    if (t.contains('evaluat') || t.contains('grade') || t.contains('oral')) {
      return Icons.assignment_turned_in_rounded;
    }
    if (t.contains('alert') || t.contains('frustrat') || t.contains('low')) {
      return Icons.warning_amber_rounded;
    }
    if (t.contains('complet') || t.contains('finish')) {
      return Icons.check_circle_rounded;
    }
    if (t.contains('announc') || t.contains('school')) {
      return Icons.campaign_rounded;
    }
    return Icons.notifications_active_rounded;
  }

  Color _getIconColor(String type, String title) {
    final t = '${type.toLowerCase()} ${title.toLowerCase()}';
    if (t.contains('alert') || t.contains('frustrat') || t.contains('low')) {
      return const Color(0xFFDC2626); // Red
    }
    if (t.contains('evaluat') || t.contains('pending')) {
      return const Color(0xFFD97706); // Amber
    }
    if (t.contains('complet')) {
      return const Color(0xFF059669); // Emerald Green
    }
    return const Color(0xFFD34426); // Brand Terracotta
  }

  Color _getIconBg(String type, String title) {
    final t = '${type.toLowerCase()} ${title.toLowerCase()}';
    if (t.contains('alert') || t.contains('frustrat') || t.contains('low')) {
      return const Color(0xFFFEE2E2);
    }
    if (t.contains('evaluat') || t.contains('pending')) {
      return const Color(0xFFFEF3C7);
    }
    if (t.contains('complet')) {
      return const Color(0xFFD1FAE5);
    }
    return const Color(0xFFFEE2E2);
  }

  @override
  Widget build(BuildContext context) {
    final notifs = _service.notifications;
    final unread = _service.unreadCount;
    final isLoading = _service.isLoading;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Iconify(Ph.bell_bold, color: Color(0xFFD34426), size: 22),
                  const SizedBox(width: 8),
                  Text(
                    'Notifications',
                    style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.black),
                  ),
                  if (unread > 0) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDC2626),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        '$unread new',
                        style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white),
                      ),
                    ),
                  ],
                ],
              ),

              // Mark All Read Button
              if (notifs.isNotEmpty && unread > 0)
                TextButton(
                  onPressed: () {
                    Feedback.forTap(context);
                    _service.markAllAsRead();
                  },
                  child: Text(
                    'Mark all read',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFFD34426),
                    ),
                  ),
                )
              else
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
            ],
          ),
          const SizedBox(height: 14),

          // Body Content
          Expanded(
            child: isLoading && notifs.isEmpty
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFFD34426)),
                  )
                : notifs.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: () => _service.fetchNotifications(),
                        color: const Color(0xFFD34426),
                        child: ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                          itemCount: notifs.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final item = notifs[index];
                            final iconColor = _getIconColor(item.notificationType, item.title);
                            final iconBg = _getIconBg(item.notificationType, item.title);
                            final iconData = _getNotificationIcon(item.notificationType, item.title);

                            return InkWell(
                              onTap: () {
                                if (!item.isRead) {
                                  _service.markAsRead(item.id);
                                }
                              },
                              borderRadius: BorderRadius.circular(14),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: item.isRead ? const Color(0xFFFCFAF7) : const Color(0xFFFFF5F3),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: item.isRead ? const Color(0xFFE2E8F0) : const Color(0xFFFECDD3),
                                    width: item.isRead ? 1 : 1.5,
                                  ),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      width: 36,
                                      height: 36,
                                      decoration: BoxDecoration(
                                        color: iconBg,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Center(
                                        child: Icon(iconData, color: iconColor, size: 18),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  item.title,
                                                  style: GoogleFonts.inter(
                                                    fontSize: 13,
                                                    fontWeight: item.isRead ? FontWeight.bold : FontWeight.w900,
                                                    color: Colors.black87,
                                                  ),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                              const SizedBox(width: 6),
                                              Text(
                                                item.timeAgo,
                                                style: GoogleFonts.inter(
                                                  fontSize: 10,
                                                  color: Colors.grey[500],
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            item.message,
                                            style: GoogleFonts.inter(
                                              fontSize: 11,
                                              color: Colors.grey[700],
                                              height: 1.3,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),

                                    // Unread Dot Indicator
                                    if (!item.isRead) ...[
                                      const SizedBox(width: 8),
                                      Container(
                                        margin: const EdgeInsets.only(top: 4),
                                        width: 8,
                                        height: 8,
                                        decoration: const BoxDecoration(
                                          color: Color(0xFFD34426),
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                    ],
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

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: const BoxDecoration(
              color: Color(0xFFFEF2F2),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Iconify(Ph.bell_slash, color: Color(0xFFD34426), size: 26),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'No Notifications',
            style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.black),
          ),
          const SizedBox(height: 4),
          Text(
            'You are all caught up! New updates will appear here.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}
