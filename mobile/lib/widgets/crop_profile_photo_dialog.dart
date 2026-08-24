import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

class CropProfilePhotoDialog extends StatefulWidget {
  final XFile imageFile;

  const CropProfilePhotoDialog({super.key, required this.imageFile});

  @override
  State<CropProfilePhotoDialog> createState() => _CropProfilePhotoDialogState();
}

class _CropProfilePhotoDialogState extends State<CropProfilePhotoDialog> {
  final GlobalKey _cropBoundaryKey = GlobalKey();
  final TransformationController _transformationController = TransformationController();
  
  double _currentScale = 1.0;
  bool _isSaving = false;

  @override
  void dispose() {
    _transformationController.dispose();
    super.dispose();
  }

  void _onSliderChanged(double value) {
    setState(() {
      _currentScale = value;
      final Matrix4 matrix = Matrix4.diagonal3Values(value, value, 1.0);
      _transformationController.value = matrix;
    });
  }

  Future<void> _cropAndSave() async {
    if (_isSaving) return;
    setState(() => _isSaving = true);

    try {
      await Future.delayed(const Duration(milliseconds: 100));
      final boundary = _cropBoundaryKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) {
        if (mounted) Navigator.pop(context, null);
        return;
      }

      final ui.Image image = await boundary.toImage(pixelRatio: 2.5);
      final ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData != null) {
        final Uint8List pngBytes = byteData.buffer.asUint8List();
        if (mounted) {
          Navigator.pop(context, pngBytes);
        }
      } else {
        if (mounted) Navigator.pop(context, null);
      }
    } catch (e) {
      if (mounted) Navigator.pop(context, null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.2),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: Title, Subtitle & Close Button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Crop Profile Photo',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Drag photo to align • Scroll to zoom',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context, null),
                  icon: const Icon(Icons.close_rounded, size: 22, color: Color(0xFF94A3B8)),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Circular Crop Viewport Center Area
            Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  RepaintBoundary(
                    key: _cropBoundaryKey,
                    child: Container(
                      width: 250,
                      height: 250,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFFF1F5F9),
                      ),
                      child: ClipOval(
                        child: InteractiveViewer(
                          transformationController: _transformationController,
                          minScale: 1.0,
                          maxScale: 3.5,
                          boundaryMargin: EdgeInsets.zero,
                          clipBehavior: Clip.hardEdge,
                          onInteractionUpdate: (_) {
                            final scale = _transformationController.value.getMaxScaleOnAxis();
                            setState(() {
                              _currentScale = scale.clamp(1.0, 3.0);
                            });
                          },
                          child: Image.file(
                            File(widget.imageFile.path),
                            fit: BoxFit.cover,
                            width: 250,
                            height: 250,
                          ),
                        ),
                      ),
                    ),
                  ),
                  IgnorePointer(
                    child: Container(
                      width: 250,
                      height: 250,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.9),
                          width: 2.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 8,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Zoom Slider Controls
            Row(
              children: [
                const Icon(Icons.zoom_out_rounded, size: 20, color: Color(0xFF64748B)),
                Expanded(
                  child: SliderTheme(
                    data: SliderThemeData(
                      activeTrackColor: const Color(0xFF1B64D8),
                      inactiveTrackColor: const Color(0xFFE2E8F0),
                      thumbColor: const Color(0xFF1B64D8),
                      overlayColor: const Color(0xFF1B64D8).withValues(alpha: 0.12),
                      trackHeight: 4,
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 9),
                    ),
                    child: Slider(
                      value: _currentScale.clamp(1.0, 3.0),
                      min: 1.0,
                      max: 3.0,
                      onChanged: _onSliderChanged,
                    ),
                  ),
                ),
                const Icon(Icons.zoom_in_rounded, size: 20, color: Color(0xFF64748B)),
              ],
            ),

            const SizedBox(height: 20),

            // Modal Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, null),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: Color(0xFFCBD5E1), width: 1.2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      backgroundColor: Colors.white,
                    ),
                    child: Text(
                      'Cancel',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF334155),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _isSaving ? null : _cropAndSave,
                    icon: _isSaving
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.check_rounded, size: 20, color: Colors.white),
                    label: Text(
                      _isSaving ? 'Saving...' : 'Save Photo',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: const Color(0xFF1B64D8),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
