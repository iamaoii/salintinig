import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/auth/registration_loading_page.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/common/policy_footer.dart';

class StudentContactAdminPage extends StatefulWidget {
  const StudentContactAdminPage({super.key});

  @override
  State<StudentContactAdminPage> createState() => _StudentContactAdminPageState();
}

class _StudentContactAdminPageState extends State<StudentContactAdminPage> {
  List<Map<String, dynamic>> _schools = [
    {
      'school_id': '109283',
      'school_name': 'Mandaluyong Elementary School',
    },
    {
      'school_id': 'MOCK-SALINTINIG-01',
      'school_name': 'SalinTinig Mock Elementary School',
    }
  ];
  String? _selectedSchoolId = '109283';

  final TextEditingController _lrnController = TextEditingController();
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _middleNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _studentEmailController = TextEditingController();
  final TextEditingController _parentEmailController = TextEditingController();

  String _sex = 'Male';
  String _gradeLevel = 'Grade 4';

  bool _isSubmitting = false;
  bool _hasError = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _fetchSchools();
  }

  @override
  void dispose() {
    _lrnController.dispose();
    _firstNameController.dispose();
    _middleNameController.dispose();
    _lastNameController.dispose();
    _studentEmailController.dispose();
    _parentEmailController.dispose();
    super.dispose();
  }

  Future<void> _fetchSchools() async {
    final schools = await AuthService.getPublicSchools();
    if (mounted) {
      setState(() {
        _schools = schools;
        if (schools.isNotEmpty) {
          _selectedSchoolId = schools.first['school_id']?.toString();
        }
      });
    }
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email.trim());
  }

  Future<void> _submitRequest() async {
    Feedback.forTap(context);
    final lrn = _lrnController.text.trim();
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final studentEmail = _studentEmailController.text.trim();

    if (_selectedSchoolId == null || _selectedSchoolId!.isEmpty) {
      _showError('Please select your school.');
      return;
    }
    if (lrn.isEmpty) {
      _showError('Please enter the 12-digit LRN.');
      return;
    }
    if (lrn.length != 12 || !RegExp(r'^\d{12}$').hasMatch(lrn)) {
      _showError('LRN must be exactly 12 numeric digits.');
      return;
    }
    if (firstName.isEmpty) {
      _showError('Please enter first name.');
      return;
    }
    if (lastName.isEmpty) {
      _showError('Please enter last name.');
      return;
    }
    if (studentEmail.isEmpty || !_isValidEmail(studentEmail)) {
      _showError('Please enter a valid student email address.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _hasError = false;
    });

    final response = await AuthService.contactAdmin(
      role: 'Student',
      schoolId: _selectedSchoolId,
      idNo: lrn,
      firstName: firstName,
      middleName: _middleNameController.text.trim(),
      lastName: lastName,
      email: studentEmail,
      sex: _sex,
      gradeLevel: _gradeLevel,
      parentEmail: _parentEmailController.text.trim(),
    );

    if (!mounted) return;
    setState(() {
      _isSubmitting = false;
    });

    if (response.success) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const RegistrationLoadingPage(),
        ),
      );
    } else {
      _showError(response.error ?? 'Failed to submit request to school admin.');
    }
  }

  void _showError(String msg) {
    setState(() {
      _hasError = true;
      _errorMessage = msg;
    });
  }

  Widget _buildFormattedLabel(String baseTitle, {bool isRequired = true}) {
    return RichText(
      text: TextSpan(
        style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: const Color(0xFF3F3F46),
        ),
        children: [
          TextSpan(text: baseTitle),
          if (isRequired)
            TextSpan(
              text: ' *',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: const Color(0xFFEF4444),
              ),
            )
          else
            TextSpan(
              text: ' (Optional)',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: const Color(0xFFA1A1AA),
              ),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);

    return Scaffold(
      backgroundColor: const Color(0xFFFCFAF7),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isTablet = constraints.maxWidth > 600;

            return Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: isTablet ? 540 : double.infinity,
                ),
                child: Column(
                  children: [
                    // Header
                    Padding(
                      padding: EdgeInsets.fromLTRB(
                        isTablet ? 0 : 20.0,
                        16.0,
                        isTablet ? 0 : 20.0,
                        12.0,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconButton(
                            onPressed: () {
                              Feedback.forTap(context);
                              Navigator.pop(context);
                            },
                            icon: const Iconify(
                              Ph.arrow_u_up_left,
                              size: 30,
                              color: Colors.black,
                            ),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                          Row(
                            children: [
                              Image.asset(
                                'assets/logo/logo_v2.webp',
                                height: 32,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'SalinTinig',
                                style: GoogleFonts.inter(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.black,
                                  letterSpacing: -0.5,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Body
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: EdgeInsets.symmetric(
                          horizontal: isTablet ? 0 : 20.0,
                          vertical: 12.0,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              'Student / Parent Support',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                fontSize: 26,
                                fontWeight: FontWeight.w800,
                                color: Colors.black,
                                letterSpacing: -0.6,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Contact your school administrator to request login credentials or account help.',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: const Color(0xFF71717A),
                                height: 1.4,
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Error Banner
                            if (_hasError) ...[
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 12,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF2F2),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: const Color(0xFFFCA5A5)),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Icon(
                                      Icons.error_rounded,
                                      size: 20,
                                      color: Color(0xFFDC2626),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            _errorMessage.contains('already assigned') || _errorMessage.contains('LRN')
                                                ? 'LRN Already Registered'
                                                : 'Submission Error',
                                            style: GoogleFonts.inter(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                              color: const Color(0xFF991B1B),
                                            ),
                                          ),
                                          const SizedBox(height: 3),
                                          Text(
                                            _errorMessage,
                                            style: GoogleFonts.inter(
                                              fontSize: 12.5,
                                              color: const Color(0xFF991B1B),
                                              height: 1.4,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 16),
                            ],

                            // School Selector
                            _buildFormattedLabel('Select School', isRequired: true),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: const Color(0xFFE4E4E7)),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: _selectedSchoolId,
                                  isExpanded: true,
                                  icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF71717A)),
                                  items: _schools.map((school) {
                                    final schoolId = school['school_id']?.toString() ?? '';
                                    final schoolName = school['school_name']?.toString() ?? 'School';
                                    return DropdownMenuItem<String>(
                                      value: schoolId,
                                      child: Text(
                                        '$schoolName ($schoolId)',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          color: Colors.black,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() {
                                        _selectedSchoolId = val;
                                      });
                                    }
                                  },
                                ),
                              ),
                            ),
                            const SizedBox(height: 14),

                            _buildTextField(
                              label: 'LRN (Learner Reference Number)',
                              isRequired: true,
                              controller: _lrnController,
                              hintText: '12-digit LRN (e.g. 136670100091)',
                              keyboardType: TextInputType.number,
                              maxLength: 12,
                              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                            ),
                            const SizedBox(height: 12),

                            _buildTextField(
                              label: 'First Name',
                              isRequired: true,
                              controller: _firstNameController,
                              hintText: 'e.g. Juan',
                            ),
                            const SizedBox(height: 12),

                            _buildTextField(
                              label: 'Middle Name',
                              isRequired: false,
                              controller: _middleNameController,
                              hintText: 'e.g. Santos',
                            ),
                            const SizedBox(height: 12),

                            _buildTextField(
                              label: 'Last Name',
                              isRequired: true,
                              controller: _lastNameController,
                              hintText: 'e.g. Dela Cruz',
                            ),
                            const SizedBox(height: 12),

                            // Row of Dropdowns: Sex / Gender, Grade Level, Section
                            LayoutBuilder(
                              builder: (context, fieldConstraints) {
                                final isSmallWidth = fieldConstraints.maxWidth < 400;

                                Widget sexDropdown = Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    _buildFormattedLabel('Sex / Gender', isRequired: true),
                                    const SizedBox(height: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: const Color(0xFFE4E4E7)),
                                      ),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          value: _sex,
                                          isExpanded: true,
                                          icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF71717A)),
                                          items: const [
                                            DropdownMenuItem(value: 'Male', child: Text('Male')),
                                            DropdownMenuItem(value: 'Female', child: Text('Female')),
                                          ],
                                          onChanged: (val) {
                                            if (val != null) {
                                              setState(() {
                                                _sex = val;
                                              });
                                            }
                                          },
                                        ),
                                      ),
                                    ),
                                  ],
                                );

                                Widget gradeDropdown = Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    _buildFormattedLabel('Grade Level', isRequired: true),
                                    const SizedBox(height: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: const Color(0xFFE4E4E7)),
                                      ),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          value: _gradeLevel,
                                          isExpanded: true,
                                          icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF71717A)),
                                          items: const [
                                            DropdownMenuItem(value: 'Grade 4', child: Text('Grade 4')),
                                            DropdownMenuItem(value: 'Grade 5', child: Text('Grade 5')),
                                            DropdownMenuItem(value: 'Grade 6', child: Text('Grade 6')),
                                          ],
                                          onChanged: (val) {
                                            if (val != null) {
                                              setState(() {
                                                _gradeLevel = val;
                                              });
                                            }
                                          },
                                        ),
                                      ),
                                    ),
                                  ],
                                );

                                if (isSmallWidth) {
                                  return Column(
                                    children: [
                                      sexDropdown,
                                      const SizedBox(height: 12),
                                      gradeDropdown,
                                    ],
                                  );
                                } else {
                                  return Row(
                                    children: [
                                      Expanded(child: sexDropdown),
                                      const SizedBox(width: 10),
                                      Expanded(child: gradeDropdown),
                                    ],
                                  );
                                }
                              },
                            ),
                            const SizedBox(height: 12),


                            _buildTextField(
                              label: 'Student Email Address',
                              isRequired: true,
                              controller: _studentEmailController,
                              hintText: 'student.email@gmail.com',
                              keyboardType: TextInputType.emailAddress,
                            ),
                            const SizedBox(height: 20),

                            // Parent Information Section Header
                            Text(
                              'Parent / Guardian Information',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: primaryBlue,
                              ),
                            ),
                            const SizedBox(height: 10),

                            _buildTextField(
                              label: 'Parent Email',
                              isRequired: false,
                              controller: _parentEmailController,
                              hintText: 'parent@gmail.com',
                              keyboardType: TextInputType.emailAddress,
                            ),
                            const SizedBox(height: 24),

                            SizedBox(
                              height: 50,
                              child: ElevatedButton(
                                onPressed: _isSubmitting ? null : _submitRequest,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: primaryBlue,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  elevation: 0,
                                ),
                                child: _isSubmitting
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2,
                                        ),
                                      )
                                    : Text(
                                        'Send Request to School Admin',
                                        style: GoogleFonts.inter(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.white,
                                        ),
                                      ),
                              ),
                            ),
                            const SizedBox(height: 24),
                            const PolicyFooter(),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    bool isRequired = true,
    required TextEditingController controller,
    required String hintText,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    int? maxLength,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildFormattedLabel(label, isRequired: isRequired),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          maxLength: maxLength,
          inputFormatters: inputFormatters,
          style: GoogleFonts.inter(fontSize: 14, color: Colors.black),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: GoogleFonts.inter(fontSize: 14, color: const Color(0xFFA1A1AA)),
            counterText: '',
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFE4E4E7)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFE4E4E7)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFF1B64D8), width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
