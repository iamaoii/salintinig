import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:image_picker/image_picker.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/user_avatar.dart';

class TeacherEditProfilePage extends StatefulWidget {
  final String currentName;
  final String currentFirstName;
  final String currentMiddleName;
  final String currentLastName;
  final String currentTitle;
  final String currentSchool;
  final String currentEmployeeId;
  final String currentEmail;
  final String currentAssignedClass;
  final IconData currentAvatarIcon;

  const TeacherEditProfilePage({
    super.key,
    required this.currentName,
    this.currentFirstName = '',
    this.currentMiddleName = '',
    this.currentLastName = '',
    required this.currentTitle,
    required this.currentSchool,
    required this.currentEmployeeId,
    required this.currentEmail,
    required this.currentAssignedClass,
    required this.currentAvatarIcon,
  });

  @override
  State<TeacherEditProfilePage> createState() => _TeacherEditProfilePageState();
}

class _TeacherEditProfilePageState extends State<TeacherEditProfilePage> {
  late TextEditingController _firstNameController;
  late TextEditingController _middleNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _titleController;
  late TextEditingController _schoolController;
  late TextEditingController _empIdController;
  late TextEditingController _emailController;
  late TextEditingController _classController;
  late IconData _selectedAvatarIcon;

  XFile? _pickedImage;
  String? _base64Image;
  bool _isUploading = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    final user = AuthService.currentUser;
    String fName = user?.firstName ?? widget.currentFirstName;
    String mName = user?.middleName ?? widget.currentMiddleName;
    String lName = user?.lastName ?? widget.currentLastName;

    if ((fName.isEmpty || fName == widget.currentName) && widget.currentName.isNotEmpty) {
      final parts = widget.currentName.trim().split(RegExp(r'\s+'));
      if (parts.length >= 3) {
        fName = parts.first;
        if (mName.isEmpty) mName = parts.sublist(1, parts.length - 1).join(' ');
        if (lName.isEmpty) lName = parts.last;
      } else if (parts.length == 2) {
        fName = parts.first;
        if (lName.isEmpty) lName = parts.last;
      } else {
        fName = widget.currentName;
      }
    }

    _firstNameController = TextEditingController(text: fName);
    _middleNameController = TextEditingController(text: mName);
    _lastNameController = TextEditingController(text: lName);
    _titleController = TextEditingController(text: widget.currentTitle);
    _schoolController = TextEditingController(text: widget.currentSchool);
    _empIdController = TextEditingController(text: widget.currentEmployeeId);
    _emailController = TextEditingController(text: widget.currentEmail);
    _classController = TextEditingController(text: widget.currentAssignedClass);
    _selectedAvatarIcon = widget.currentAvatarIcon;
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _middleNameController.dispose();
    _lastNameController.dispose();
    _titleController.dispose();
    _schoolController.dispose();
    _empIdController.dispose();
    _emailController.dispose();
    _classController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final file = await _picker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );
      if (file != null) {
        final bytes = await file.readAsBytes();
        final base64Str = 'data:image/jpeg;base64,${base64Encode(bytes)}';
        setState(() {
          _pickedImage = file;
          _base64Image = base64Str;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to pick photo: ${e.toString()}'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _showPhotoPickerOptions() {
    Feedback.forTap(context);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final hasExistingPhoto = _pickedImage != null ||
            (AuthService.currentUser?.rawUser?['profileImage'] ?? AuthService.currentUser?.rawUser?['profile_image']) != null;

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 8.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Text(
                  'Change Profile Picture',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFFDF4F2),
                    child: Icon(Icons.photo_library_rounded, color: Color(0xFFD34426)),
                  ),
                  title: Text(
                    'Choose from Gallery',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    _pickImage(ImageSource.gallery);
                  },
                ),
                ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFFDF4F2),
                    child: Icon(Icons.camera_alt_rounded, color: Color(0xFFD34426)),
                  ),
                  title: Text(
                    'Take a Photo',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    _pickImage(ImageSource.camera);
                  },
                ),
                if (hasExistingPhoto)
                  ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.red[50],
                      child: const Icon(Icons.delete_outline_rounded, color: Colors.red),
                    ),
                    title: Text(
                      'Remove Photo',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: Colors.red),
                    ),
                    onTap: () {
                      Navigator.pop(context);
                      setState(() {
                        _pickedImage = null;
                        _base64Image = '';
                      });
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _saveProfile() async {
    Feedback.forTap(context);
    if (_firstNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('First name cannot be empty.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    if (_lastNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Last name cannot be empty.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final fullName = [
      _firstNameController.text.trim(),
      if (_middleNameController.text.trim().isNotEmpty) _middleNameController.text.trim(),
      _lastNameController.text.trim(),
    ].join(' ');

    setState(() => _isUploading = true);

    try {
      final Map<String, dynamic> body = {
        'firstName': _firstNameController.text.trim(),
        'middleName': _middleNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'first_name': _firstNameController.text.trim(),
        'middle_name': _middleNameController.text.trim(),
        'last_name': _lastNameController.text.trim(),
        'name': fullName,
        'fullName': fullName,
      };
      if (_base64Image != null) {
        body['profileImage'] = _base64Image;
      }

      final response = await ApiService.put('/auth/profile', body);
      if (response.success) {
        await AuthService.fetchMe();
      }
    } catch (e) {
      debugPrint('Profile update error: $e');
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }

    if (mounted) {
      final updatedData = {
        'name': fullName,
        'firstName': _firstNameController.text.trim(),
        'middleName': _middleNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'title': _titleController.text.trim(),
        'school': _schoolController.text.trim(),
        'employeeId': _empIdController.text.trim(),
        'email': _emailController.text.trim(),
        'assignedClass': _classController.text.trim(),
        'avatarIcon': _selectedAvatarIcon,
      };

      Navigator.pop(context, updatedData);
    }
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);

    return Scaffold(
      backgroundColor: softBg,
      appBar: AppBar(
        backgroundColor: softBg,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: Colors.black),
        ),
        centerTitle: true,
        title: Text(
          'Edit Profile',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.black,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar Selection Section Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    Stack(
                      children: [
                        GestureDetector(
                          onTap: _showPhotoPickerOptions,
                          child: Container(
                            width: 90,
                            height: 90,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFFD34426), width: 2.5),
                              color: const Color(0xFFFDF4F2),
                            ),
                            child: ClipOval(
                              child: _pickedImage != null
                                  ? Image.file(
                                      File(_pickedImage!.path),
                                      fit: BoxFit.cover,
                                      width: 90,
                                      height: 90,
                                    )
                                  : (_base64Image == ''
                                      ? InitialsAvatar(
                                          name: _firstNameController.text.isNotEmpty ? '${_firstNameController.text} ${_lastNameController.text}' : widget.currentName,
                                          imageUrl: null,
                                          radius: 42,
                                          fontSize: 26,
                                        )
                                      : InitialsAvatar(
                                          name: _firstNameController.text.isNotEmpty ? '${_firstNameController.text} ${_lastNameController.text}' : widget.currentName,
                                          imageUrl: (AuthService.currentUser?.rawUser?['profileImage'] ?? AuthService.currentUser?.rawUser?['profile_image'])?.toString(),
                                          radius: 42,
                                          fontSize: 26,
                                        )),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: GestureDetector(
                            onTap: _showPhotoPickerOptions,
                            child: Container(
                              padding: const EdgeInsets.all(7),
                              decoration: BoxDecoration(
                                color: const Color(0xFFD34426),
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 2),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.15),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: const Icon(Icons.camera_alt_rounded, size: 14, color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    OutlinedButton.icon(
                      onPressed: _showPhotoPickerOptions,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFD34426),
                        side: const BorderSide(color: Color(0xFFFBE8E6), width: 1.5),
                        backgroundColor: const Color(0xFFFDF4F2),
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(100),
                        ),
                      ),
                      icon: const Icon(Icons.photo_camera_rounded, size: 16, color: Color(0xFFD34426)),
                      label: Text(
                        'Change Profile Picture',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Personal Info Fields Container
              _buildSectionTitle('Personal Details', Ph.user),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    _buildInputField('First Name', _firstNameController, Ph.user),
                    const SizedBox(height: 14),
                    _buildInputField('Middle Name (Optional)', _middleNameController, Ph.user),
                    const SizedBox(height: 14),
                    _buildInputField('Last Name', _lastNameController, Ph.user),
                    const SizedBox(height: 14),
                    _buildInputField('Designation / Position', _titleController, Ph.briefcase, isReadOnly: true),
                    const SizedBox(height: 14),
                    _buildInputField('School Name', _schoolController, Ph.buildings, isReadOnly: true),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Account & Class Fields Container
              _buildSectionTitle('Account & Assignment', Ph.identification_card),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    _buildInputField('Employee ID', _empIdController, Ph.identification_badge, isReadOnly: true),
                    const SizedBox(height: 14),
                    _buildInputField('Email Address', _emailController, Ph.envelope_simple),
                    const SizedBox(height: 14),
                    _buildInputField('Assigned Class', _classController, Ph.users_three, isReadOnly: true),
                  ],
                ),
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
          child: ElevatedButton(
            onPressed: _isUploading ? null : _saveProfile,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFD34426),
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              minimumSize: const Size(double.infinity, 52),
            ),
            child: _isUploading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : Text(
                    'Save Profile Changes',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, String iconName) {
    return Row(
      children: [
        Iconify(iconName, color: const Color(0xFFD34426), size: 18),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildInputField(
    String label,
    TextEditingController controller,
    String iconName, {
    bool isReadOnly = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.grey[700],
              ),
            ),
            if (isReadOnly)
              Text(
                'Read Only',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[500],
                ),
              ),
          ],
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          enabled: !isReadOnly,
          readOnly: isReadOnly,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isReadOnly ? Colors.grey[700] : Colors.black,
          ),
          decoration: InputDecoration(
            prefixIcon: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Iconify(
                iconName,
                color: isReadOnly ? Colors.grey[500]! : const Color(0xFFD34426),
                size: 18,
              ),
            ),
            filled: true,
            fillColor: isReadOnly ? const Color(0xFFF1F5F9) : const Color(0xFFF8FAFC),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFD34426), width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
