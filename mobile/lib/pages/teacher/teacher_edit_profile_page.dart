import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';

class TeacherEditProfilePage extends StatefulWidget {
  final String currentName;
  final String currentTitle;
  final String currentSchool;
  final String currentEmployeeId;
  final String currentEmail;
  final String currentContactNumber;
  final String currentAssignedClass;
  final IconData currentAvatarIcon;

  const TeacherEditProfilePage({
    super.key,
    required this.currentName,
    required this.currentTitle,
    required this.currentSchool,
    required this.currentEmployeeId,
    required this.currentEmail,
    required this.currentContactNumber,
    required this.currentAssignedClass,
    required this.currentAvatarIcon,
  });

  @override
  State<TeacherEditProfilePage> createState() => _TeacherEditProfilePageState();
}

class _TeacherEditProfilePageState extends State<TeacherEditProfilePage> {
  late TextEditingController _nameController;
  late TextEditingController _titleController;
  late TextEditingController _schoolController;
  late TextEditingController _empIdController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _classController;
  late IconData _selectedAvatarIcon;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.currentName);
    _titleController = TextEditingController(text: widget.currentTitle);
    _schoolController = TextEditingController(text: widget.currentSchool);
    _empIdController = TextEditingController(text: widget.currentEmployeeId);
    _emailController = TextEditingController(text: widget.currentEmail);
    _phoneController = TextEditingController(text: widget.currentContactNumber);
    _classController = TextEditingController(text: widget.currentAssignedClass);
    _selectedAvatarIcon = widget.currentAvatarIcon;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _titleController.dispose();
    _schoolController.dispose();
    _empIdController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _classController.dispose();
    super.dispose();
  }

  void _saveProfile() {
    Feedback.forTap(context);
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Full name cannot be empty.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final updatedData = {
      'name': _nameController.text.trim(),
      'title': _titleController.text.trim(),
      'school': _schoolController.text.trim(),
      'employeeId': _empIdController.text.trim(),
      'email': _emailController.text.trim(),
      'contactNumber': _phoneController.text.trim(),
      'assignedClass': _classController.text.trim(),
      'avatarIcon': _selectedAvatarIcon,
    };

    Navigator.pop(context, updatedData);
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
                    Container(
                      width: 86,
                      height: 86,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFD34426), width: 2.5),
                        color: const Color(0xFFFDF4F2),
                      ),
                      child: CircleAvatar(
                        radius: 40,
                        backgroundColor: const Color(0xFFFDF4F2),
                        child: Icon(_selectedAvatarIcon, size: 50, color: const Color(0xFFD34426)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Choose Profile Avatar Icon',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _buildAvatarOption(Icons.person_rounded),
                        const SizedBox(width: 12),
                        _buildAvatarOption(Icons.face_rounded),
                        const SizedBox(width: 12),
                        _buildAvatarOption(Icons.account_circle_rounded),
                        const SizedBox(width: 12),
                        _buildAvatarOption(Icons.school_rounded),
                        const SizedBox(width: 12),
                        _buildAvatarOption(Icons.psychology_rounded),
                      ],
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
                    _buildInputField('Full Name', _nameController, Ph.user),
                    const SizedBox(height: 14),
                    _buildInputField('Designation / Position', _titleController, Ph.briefcase),
                    const SizedBox(height: 14),
                    _buildInputField('School Name', _schoolController, Ph.buildings),
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
                    _buildInputField('Employee ID', _empIdController, Ph.identification_badge),
                    const SizedBox(height: 14),
                    _buildInputField('Email Address', _emailController, Ph.envelope_simple),
                    const SizedBox(height: 14),
                    _buildInputField('Contact Number', _phoneController, Ph.phone),
                    const SizedBox(height: 14),
                    _buildInputField('Assigned Class', _classController, Ph.users_three),
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
            onPressed: _saveProfile,
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
            child: Text(
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

  Widget _buildAvatarOption(IconData icon) {
    final isSelected = _selectedAvatarIcon == icon;
    return GestureDetector(
      onTap: () => setState(() => _selectedAvatarIcon = icon),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFD34426) : const Color(0xFFF8FAFC),
          shape: BoxShape.circle,
          border: Border.all(
            color: isSelected ? const Color(0xFFD34426) : const Color(0xFFE2E8F0),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: [
            if (isSelected)
              BoxShadow(
                color: const Color(0xFFD34426).withValues(alpha: 0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Center(
          child: Icon(
            icon,
            size: 24,
            color: isSelected ? Colors.white : Colors.grey[700],
          ),
        ),
      ),
    );
  }

  Widget _buildInputField(String label, TextEditingController controller, String iconName) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.black),
          decoration: InputDecoration(
            prefixIcon: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Iconify(iconName, color: const Color(0xFFD34426), size: 18),
            ),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
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
