import { students } from './students.js';

export const adminStats = {
  totalStudents: 833,
  totalTeachers: 24,
  totalParentAccounts: 750,
  totalSections: 15,
  totalGradeLevels: 3,
};

export const recentActivities = [
  {
    id: 1,
    type: 'upload',
    title: 'Uploaded Student Records',
    details: 'Batch import for Grade 4 - 52 new student accounts generated',
    timestamp: '10 minutes ago',
    user: 'Admin (antoinette.j@deped.gov.ph)',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  {
    id: 2,
    type: 'assignment',
    title: 'Assigned Faculty-in-Charge',
    details: 'Assigned Antoinette Jadaone as Faculty-in-Charge for Grade 4',
    timestamp: '1 hour ago',
    user: 'Admin (antoinette.j@deped.gov.ph)',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 3,
    type: 'user',
    title: 'Teacher Account Activated',
    details: 'Activated account for Maria Santos (Emp ID: T-2024-089)',
    timestamp: '3 hours ago',
    user: 'System Administrator',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    id: 4,
    type: 'upload',
    title: 'Uploaded Teacher Records',
    details: 'CSV Import: 12 new faculty accounts created & credentials emailed',
    timestamp: 'Yesterday at 4:30 PM',
    user: 'Admin (antoinette.j@deped.gov.ph)',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  {
    id: 5,
    type: 'security',
    title: 'Deactivated User Account',
    details: 'Deactivated inactive parent account (p.reyes@gmail.com)',
    timestamp: '2 days ago',
    user: 'System Administrator',
    badgeColor: 'bg-red-100 text-red-700',
  },
];

export const initialAdminStudents = [];

export const initialAdminTeachers = [];

export const sectionsByGrade = {
  'Grade 4': ['Fyang', 'Kalapati'],
  'Grade 5': ['Agila', 'Sampaguita'],
  'Grade 6': ['Narra', 'Rizal'],
};

export const initialAdminUsers = [];

export const initialFacultyAssignments = [
  {
    gradeLevel: 'Grade 4',
    facultyInCharge: 'Unassigned',
    email: '',
    sectionsCount: 0,
    studentsCount: 0,
    status: 'Unassigned',
  },
  {
    gradeLevel: 'Grade 5',
    facultyInCharge: 'Unassigned',
    email: '',
    sectionsCount: 0,
    studentsCount: 0,
    status: 'Unassigned',
  },
  {
    gradeLevel: 'Grade 6',
    facultyInCharge: 'Unassigned',
    email: '',
    sectionsCount: 0,
    studentsCount: 0,
    status: 'Unassigned',
  },
];
