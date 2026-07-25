import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'teacher_edit_profile_page.dart';

class TeacherProfilePage extends StatefulWidget {
  const TeacherProfilePage({super.key});

  @override
  State<TeacherProfilePage> createState() => _TeacherProfilePageState();
}

class _TeacherProfilePageState extends State<TeacherProfilePage> {
  String _teacherName = 'Maria Santos';
  String _teacherTitle = 'Grade IV Teacher';
  String _schoolName = 'San Juan Elementary School';
  String _employeeId = '198420349';
  String _emailAddress = 'maria.santos@deped.gov.ph';
  String _contactNumber = '+63 917 890 1234';
  String _assignedClass = 'Grade 4 - FYANG';
  IconData _selectedAvatarIcon = Icons.person_rounded;

  Future<void> _openEditProfilePage() async {
    Feedback.forTap(context);
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => TeacherEditProfilePage(
          currentName: _teacherName,
          currentTitle: _teacherTitle,
          currentSchool: _schoolName,
          currentEmployeeId: _employeeId,
          currentEmail: _emailAddress,
          currentContactNumber: _contactNumber,
          currentAssignedClass: _assignedClass,
          currentAvatarIcon: _selectedAvatarIcon,
        ),
      ),
    );

    if (result != null && mounted) {
      setState(() {
        _teacherName = result['name'] ?? _teacherName;
        _teacherTitle = result['title'] ?? _teacherTitle;
        _schoolName = result['school'] ?? _schoolName;
        _employeeId = result['employeeId'] ?? _employeeId;
        _emailAddress = result['email'] ?? _emailAddress;
        _contactNumber = result['contactNumber'] ?? _contactNumber;
        _assignedClass = result['assignedClass'] ?? _assignedClass;
        _selectedAvatarIcon = result['avatarIcon'] ?? _selectedAvatarIcon;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile updated successfully!'),
          backgroundColor: Color(0xFF059669),
          behavior: SnackBarBehavior.floating,
        ),
      );
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
          'My Profile',
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
          padding: const EdgeInsets.fromLTRB(20.0, 8.0, 20.0, 24.0),
          child: Column(
            children: [
              // Header Profile Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Profile Avatar
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
                    const SizedBox(height: 14),

                    // Teacher Name & Credentials
                    Text(
                      _teacherName,
                      style: GoogleFonts.inter(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _teacherTitle,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFFD34426),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _schoolName,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: _openEditProfilePage,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFD34426),
                        side: const BorderSide(color: Color(0xFFFBE8E6), width: 1.5),
                        backgroundColor: const Color(0xFFFDF4F2),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(100),
                        ),
                      ),
                      icon: Iconify(Ph.pencil_simple, color: const Color(0xFFD34426), size: 16),
                      label: Text(
                        'Edit Profile',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Account & Personal Info Section
              _buildSectionHeader('Account Details', Ph.user),
              const SizedBox(height: 10),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    _buildDetailTile(
                      icon: Ph.identification_card,
                      label: 'Employee ID',
                      value: _employeeId,
                    ),
                    const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F5F9)),
                    _buildDetailTile(
                      icon: Ph.envelope_simple,
                      label: 'Email Address',
                      value: _emailAddress,
                    ),
                    const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F5F9)),
                    _buildDetailTile(
                      icon: Ph.phone,
                      label: 'Contact Number',
                      value: _contactNumber,
                    ),
                    const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F5F9)),
                    _buildDetailTile(
                      icon: Ph.users_three,
                      label: 'Assigned Class',
                      value: _assignedClass,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, String iconName) {
    return Row(
      children: [
        Iconify(iconName, color: const Color(0xFFD34426), size: 20),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: Colors.black,
          ),
        ),
      ],
    );
  }

  Widget _buildDetailTile({
    required String icon,
    required String label,
    required String value,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(
          child: Iconify(icon, color: Colors.grey[700], size: 18),
        ),
      ),
      title: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: Colors.grey[600],
        ),
      ),
      subtitle: Text(
        value,
        style: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: Colors.black,
        ),
      ),
    );
  }
}
