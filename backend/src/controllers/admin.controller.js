const supabase = require('../config/supabase.js');

/**
 * Helper to generate a unique Parent Access Code (e.g. PAC-48219)
 */
function generateParentAccessCode() {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `PAC-${randomNum}`;
}

// In-Memory Database Store for backend REST endpoints
let teachersStore = [
  {
    id: 'TCH-101',
    employeeId: 'EMP-2024-001',
    name: 'Antoinette Jadaone',
    gender: 'Female',
    email: 'antoinette.jadaone@deped.gov.ph',
    gradeAssigned: 'Grade 4',
    sectionAssigned: 'Fyang',
    isFacultyInCharge: true,
    status: 'Active',
    dateAdded: '2025-06-15',
  },
  {
    id: 'TCH-102',
    employeeId: 'EMP-2024-002',
    name: 'Bernadette Reyes',
    gender: 'Female',
    email: 'bernadette.reyes@deped.gov.ph',
    gradeAssigned: 'Grade 4',
    sectionAssigned: 'Kalapati',
    isFacultyInCharge: false,
    status: 'Active',
    dateAdded: '2025-06-15',
  },
  {
    id: 'TCH-103',
    employeeId: 'EMP-2024-003',
    name: 'Carlos Mendoza',
    gender: 'Male',
    email: 'carlos.mendoza@deped.gov.ph',
    gradeAssigned: 'Grade 5',
    sectionAssigned: 'Sampaguita',
    isFacultyInCharge: false,
    status: 'Active',
    dateAdded: '2025-06-15',
  },
];

let studentsStore = [
  {
    id: 'STD-1001',
    lrn: '109283748291',
    name: 'Adrian Dela Cruz',
    gender: 'Male',
    grade: 'Grade 4',
    section: 'Fyang',
    level: 'Instructional',
    personalEmail: 'adrian.delacruz@gmail.com',
    status: 'Account Created',
    parentAccessCode: 'PAC-88491',
  },
  {
    id: 'STD-1002',
    lrn: '109283748292',
    name: 'Janna Santos',
    gender: 'Female',
    grade: 'Grade 4',
    section: 'Fyang',
    level: 'Independent',
    personalEmail: 'janna.santos@gmail.com',
    status: 'Account Created',
    parentAccessCode: 'PAC-88492',
  },
  {
    id: 'STD-1003',
    lrn: '109283748293',
    name: 'Mateo Reyes',
    gender: 'Male',
    grade: 'Grade 4',
    section: 'Fyang',
    level: 'Frustrational',
    personalEmail: 'mateo.reyes@gmail.com',
    status: 'Account Created',
    parentAccessCode: 'PAC-88493',
  },
];

/**
 * GET /api/admin/teachers — List all teachers
 */
async function getTeachers(req, res) {
  try {
    return res.json({ success: true, teachers: teachersStore });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch teachers.' });
  }
}

/**
 * POST /api/admin/teachers — Create single teacher (Requires Employee ID)
 */
async function createTeacher(req, res) {
  try {
    const { employeeId, name, gender, email, gradeAssigned, sectionAssigned, isFacultyInCharge } = req.body;

    if (!employeeId || !employeeId.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID is required and must be provided by Admin.',
      });
    }

    const cleanEmpId = employeeId.trim().toUpperCase();

    // Validate uniqueness
    const exists = teachersStore.some((t) => t.employeeId.toUpperCase() === cleanEmpId);
    if (exists) {
      return res.status(400).json({
        success: false,
        error: `Teacher with Employee ID "${cleanEmpId}" already exists.`,
      });
    }

    const newTeacher = {
      id: `TCH-${Date.now().toString().slice(-4)}`,
      employeeId: cleanEmpId,
      name: name?.trim() || 'Faculty Member',
      gender: gender || 'Female',
      email: email?.trim() || `${cleanEmpId.toLowerCase()}@deped.gov.ph`,
      gradeAssigned: gradeAssigned || 'Grade 4',
      sectionAssigned: sectionAssigned || 'Unassigned',
      isFacultyInCharge: Boolean(isFacultyInCharge),
      status: 'Active',
      dateAdded: new Date().toISOString().split('T')[0],
    };

    teachersStore.unshift(newTeacher);

    return res.status(201).json({
      success: true,
      message: 'Teacher account created successfully.',
      teacher: newTeacher,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create teacher account.' });
  }
}

/**
 * GET /api/admin/students — List all students with parentAccessCode
 */
async function getStudents(req, res) {
  try {
    return res.json({ success: true, students: studentsStore });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch students.' });
  }
}

/**
 * POST /api/admin/students — Create single student (Requires LRN & Auto-generates Parent Access Code)
 */
async function createStudent(req, res) {
  try {
    const { lrn, name, gender, grade, section, personalEmail } = req.body;

    if (!lrn || !lrn.trim()) {
      return res.status(400).json({
        success: false,
        error: 'LRN (Learner Reference Number) is required and must be provided by Admin.',
      });
    }

    const cleanLrn = lrn.trim();

    // Validate LRN uniqueness
    const exists = studentsStore.some((s) => s.lrn === cleanLrn);
    if (exists) {
      return res.status(400).json({
        success: false,
        error: `Student with LRN "${cleanLrn}" already exists.`,
      });
    }

    const parentAccessCode = generateParentAccessCode();

    const newStudent = {
      id: `STD-${Date.now().toString().slice(-4)}`,
      lrn: cleanLrn,
      name: name?.trim() || 'Student Name',
      gender: gender || 'Male',
      grade: grade || 'Grade 4',
      section: section || 'Fyang',
      level: 'Pending Evaluation',
      personalEmail: personalEmail?.trim() || `${cleanLrn}@student.deped.gov.ph`,
      status: 'Account Created',
      parentAccessCode,
    };

    studentsStore.unshift(newStudent);

    return res.status(201).json({
      success: true,
      message: 'Student account created and Parent Access Code generated successfully.',
      student: newStudent,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create student record.' });
  }
}

/**
 * POST /api/admin/import-csv — CSV Batch Import for Teachers or Students
 */
async function batchImportCSV(req, res) {
  try {
    const { type, records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'No records provided in CSV payload.' });
    }

    const imported = [];
    const errors = [];

    if (type === 'teacher') {
      records.forEach((row, i) => {
        const empId = (row.employeeId || row.employee_id || row['Employee ID'] || '').trim().toUpperCase();
        if (!empId) {
          errors.push(`Row ${i + 1}: Missing Employee ID`);
          return;
        }

        const name = (row.name || row.Name || row['Full Name'] || 'Teacher').trim();
        const email = (row.email || row.Email || `${empId.toLowerCase()}@deped.gov.ph`).trim();

        const exists = teachersStore.some((t) => t.employeeId.toUpperCase() === empId);
        if (exists) {
          errors.push(`Row ${i + 1}: Employee ID "${empId}" already exists`);
          return;
        }

        const newTeacher = {
          id: `TCH-${Date.now().toString().slice(-4)}-${i}`,
          employeeId: empId,
          name,
          gender: row.gender || 'Female',
          email,
          gradeAssigned: row.gradeAssigned || row.grade || 'Grade 4',
          sectionAssigned: row.sectionAssigned || row.section || 'General',
          isFacultyInCharge: Boolean(row.isFacultyInCharge),
          status: 'Active',
          dateAdded: new Date().toISOString().split('T')[0],
        };

        teachersStore.unshift(newTeacher);
        imported.push(newTeacher);
      });
    } else {
      // Default: student batch import
      records.forEach((row, i) => {
        const lrn = String(row.lrn || row.LRN || row['Student LRN'] || '').trim();
        if (!lrn) {
          errors.push(`Row ${i + 1}: Missing LRN`);
          return;
        }

        const name = (row.name || row.Name || row['Student Name'] || 'Student').trim();
        const exists = studentsStore.some((s) => s.lrn === lrn);
        if (exists) {
          errors.push(`Row ${i + 1}: LRN "${lrn}" already exists`);
          return;
        }

        const parentAccessCode = generateParentAccessCode();
        const newStudent = {
          id: `STD-${Date.now().toString().slice(-4)}-${i}`,
          lrn,
          name,
          gender: row.gender || 'Male',
          grade: row.grade || 'Grade 4',
          section: row.section || 'Fyang',
          level: row.level || 'Pending Evaluation',
          personalEmail: (row.personalEmail || row.email || `${lrn}@student.deped.gov.ph`).trim(),
          status: 'Account Created',
          parentAccessCode,
        };

        studentsStore.unshift(newStudent);
        imported.push(newStudent);
      });
    }

    return res.json({
      success: true,
      count: imported.length,
      importedRecords: imported,
      errors: errors.length > 0 ? errors : undefined,
      message: `Batch import completed. Successfully processed ${imported.length} accounts.`,
    });
  } catch (error) {
    console.error('CSV Import Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to process CSV batch upload.' });
  }
}

/**
 * POST /api/admin/verify-parent-code — Validate student LRN + Parent Access Code for Parent signup
 */
async function verifyParentAccessCode(req, res) {
  try {
    const { lrn, parentAccessCode } = req.body;

    if (!lrn || !parentAccessCode) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both Student LRN and Parent Access Code.',
      });
    }

    const cleanLrn = lrn.trim();
    const cleanCode = parentAccessCode.trim().toUpperCase();

    const student = studentsStore.find(
      (s) => s.lrn === cleanLrn && s.parentAccessCode.toUpperCase() === cleanCode
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Invalid Student LRN or Parent Access Code. Please double-check with the school administrator.',
      });
    }

    return res.json({
      success: true,
      message: 'Parent Access Code verified successfully!',
      student: {
        lrn: student.lrn,
        name: student.name,
        grade: student.grade,
        section: student.section,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to verify Parent Access Code.' });
  }
}

/**
 * POST /api/admin/faculty-assignment — Update faculty assignment
 */
async function assignFaculty(req, res) {
  try {
    const { teacherId, gradeAssigned, sectionAssigned, isFacultyInCharge } = req.body;

    const teacher = teachersStore.find((t) => t.id === teacherId || t.employeeId === teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher record not found.' });
    }

    if (gradeAssigned) teacher.gradeAssigned = gradeAssigned;
    if (sectionAssigned) teacher.sectionAssigned = sectionAssigned;
    if (typeof isFacultyInCharge === 'boolean') teacher.isFacultyInCharge = isFacultyInCharge;

    return res.json({
      success: true,
      message: `Faculty assignment updated for ${teacher.name}.`,
      teacher,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update faculty assignment.' });
  }
}

module.exports = {
  getTeachers,
  createTeacher,
  getStudents,
  createStudent,
  batchImportCSV,
  verifyParentAccessCode,
  assignFaculty,
};
