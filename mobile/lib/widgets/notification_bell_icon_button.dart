import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/services/notification_service.dart';
import 'package:salintinig/widgets/notification_center_modal.dart';

class NotificationBellIconButton extends StatefulWidget {
  const NotificationBellIconButton({super.key});

  @override
  State<NotificationBellIconButton> createState() => _NotificationBellIconButtonState();
}

class _NotificationBellIconButtonState extends State<NotificationBellIconButton> {
  final NotificationService _service = NotificationService();

  @override
  void initState() {
    super.initState();
    _service.addListener(_onUpdate);
    // Fetch notifications on mount
    _service.fetchNotifications();
  }

  @override
  void dispose() {
    _service.removeListener(_onUpdate);
    super.dispose();
  }

  void _onUpdate() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final unread = _service.unreadCount;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          onPressed: () => NotificationCenterModal.show(context),
          icon: const Iconify(
            Ph.bell,
            size: 28,
            color: Colors.black,
          ),
        ),
        if (unread > 0)
          Positioned(
            right: 6,
            top: 6,
            child: IgnorePointer(
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Color(0xFFDC2626),
                  shape: BoxShape.circle,
                ),
                constraints: const BoxConstraints(
                  minWidth: 16,
                  minHeight: 16,
                ),
                child: Text(
                  unread > 99 ? '99+' : '$unread',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
