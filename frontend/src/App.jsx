import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/auth/Login.jsx';
import ForgotPasswordEmail from './pages/auth/ForgotPasswordEmail.jsx';
import EnterCode from './pages/auth/EnterCode.jsx';
import EnterNewPassword from './pages/auth/EnterNewPassword.jsx';
import PasswordChangedSuccess from './pages/auth/PasswordChangedSuccess.jsx';
import SignupEmail from './pages/auth/SignupEmail.jsx';
import RequestSent from './pages/auth/RequestSent.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import { isLoggedIn, getUserRole } from './lib/auth.js';

import DashboardLayout from './pages/dashboard/DashboardLayout.jsx';
import OverviewLayout from './pages/dashboard/overview/OverviewLayout.jsx';
import OverviewActivities from './pages/dashboard/overview/OverviewActivities.jsx';
import OverviewForms from './pages/dashboard/overview/OverviewForms.jsx';
import OverviewPeople from './pages/dashboard/overview/OverviewPeople.jsx';
import AccountSettings from './pages/dashboard/settings/AccountSettings.jsx';
import EditAvatar from './pages/dashboard/settings/EditAvatar.jsx';
import TeacherNotifications from './pages/dashboard/notifications/TeacherNotifications.jsx';
import StudentDashboardLayout from './pages/dashboard/student/StudentDashboardLayout.jsx';
import StudentMasterlist from './pages/dashboard/student/StudentMasterlist.jsx';
import StudentProfile from './pages/dashboard/student/StudentProfile.jsx';
import ClassActivities from './pages/dashboard/activities/ClassActivities.jsx';
import ActivityFormPage from './pages/dashboard/activities/ActivityFormPage.jsx';
import ActivitySuccess from './pages/dashboard/activities/ActivitySuccess.jsx';
import ActivityDetailPage from './pages/dashboard/activities/ActivityDetailPage.jsx';
import PhilIriLayout from './pages/dashboard/phil-iri/PhilIriLayout.jsx';
import PhilIriForm1 from './pages/dashboard/phil-iri/PhilIriForm1.jsx';
import PhilIriForm2 from './pages/dashboard/phil-iri/PhilIriForm2.jsx';
import PhilIriForm3List from './pages/dashboard/phil-iri/PhilIriForm3List.jsx';
import PhilIriForm3Detail from './pages/dashboard/phil-iri/PhilIriForm3Detail.jsx';
import PhilIriForm4Detail from './pages/dashboard/phil-iri/PhilIriForm4Detail.jsx';
import PhilIriExportSuccess from './pages/dashboard/phil-iri/PhilIriExportSuccess.jsx';
import PhilIriAssignPage from './pages/dashboard/phil-iri/PhilIriAssignPage.jsx';
import PhilIriPassageBank from './pages/dashboard/phil-iri/PhilIriPassageBank.jsx';
import GradeLevelPage from './pages/dashboard/grade-level/GradeLevelPage.jsx';
import FicTeacherProfilePage from './pages/dashboard/grade-level/FicTeacherProfilePage.jsx';

import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboardHome from './pages/admin/AdminDashboardHome.jsx';
import AdminStudentRecords from './pages/admin/AdminStudentRecords.jsx';
import AdminStudentProfile from './pages/admin/AdminStudentProfile.jsx';
import AdminTeacherRecords from './pages/admin/AdminTeacherRecords.jsx';
import TeacherProfile from './pages/admin/TeacherProfile.jsx';
import AdminFacultyAssignment from './pages/admin/AdminFacultyAssignment.jsx';
import AdminAccountRequests from './pages/admin/AdminAccountRequests.jsx';
import AdminPhilIriReports from './pages/admin/AdminPhilIriReports.jsx';
import AdminPhilIriPassages from './pages/admin/AdminPhilIriPassages.jsx';
import AdminPhilIriAssessment from './pages/admin/AdminPhilIriAssessment.jsx';
import AdminNotifications from './pages/admin/AdminNotifications.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminRecordsLayout from './pages/admin/AdminRecordsLayout.jsx';
import AdminSectionsLayout from './pages/admin/AdminSectionsLayout.jsx';
import AdminPhilIriLayout from './pages/admin/AdminPhilIriLayout.jsx';

function HomeRedirect() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  const role = getUserRole();
  return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/teacher'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPasswordEmail />} />
      <Route path="/forgot-password/code" element={<EnterCode />} />
      <Route path="/forgot-password/new-password" element={<EnterNewPassword />} />
      <Route path="/forgot-password/success" element={<PasswordChangedSuccess />} />
      <Route path="/signup" element={<SignupEmail />} />
      <Route path="/signup/success" element={<RequestSent />} />
      <Route path="/dashboard" element={<Navigate to="/teacher" replace />} />
      <Route path="/dashboard/*" element={<Navigate to="/teacher" replace />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardHome />} />

        {/* Records Group — layout with sub-tabs inside */}
        <Route path="records" element={<AdminRecordsLayout />}>
          <Route index element={<Navigate to="students" replace />} />
          <Route path="students" element={<AdminStudentRecords />} />
          <Route path="teachers" element={<AdminTeacherRecords />} />
        </Route>
        <Route path="records/students/:lrn" element={<AdminStudentProfile />} />
        <Route path="records/teachers/:id" element={<TeacherProfile />} />

        <Route path="sections" element={<AdminFacultyAssignment />} />
        <Route path="sections/*" element={<Navigate to="/admin/sections" replace />} />

        {/* Phil-IRI Group — layout with sub-tabs inside */}
        <Route path="phil-iri" element={<AdminPhilIriLayout />}>
          <Route index element={<Navigate to="assessment" replace />} />
          <Route path="assessment" element={<AdminPhilIriAssessment />} />
          <Route path="passages" element={<AdminPhilIriPassages />} />
          <Route path="reports" element={<AdminPhilIriReports />} />
        </Route>

        {/* Other */}
        <Route path="requests" element={<AdminAccountRequests />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="account" element={<AdminSettings />} />
        <Route path="account/:tab" element={<AdminSettings />} />

        {/* Legacy redirects */}
        <Route path="students" element={<Navigate to="/admin/records/students" replace />} />
        <Route path="teachers" element={<Navigate to="/admin/records/teachers" replace />} />
        <Route path="faculty-assignment" element={<Navigate to="/admin/sections/list" replace />} />
        <Route path="reports" element={<Navigate to="/admin/phil-iri/reports" replace />} />
        <Route path="activities" element={<Navigate to="/admin/phil-iri/assessment" replace />} />
        <Route path="settings" element={<Navigate to="/admin/account" replace />} />
        <Route path="profile" element={<Navigate to="/admin/account" replace />} />
      </Route>

      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRole="teacher">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />

        <Route path="overview" element={<OverviewLayout />}>
          <Route index element={<Navigate to="forms" replace />} />
          <Route path="activities" element={<OverviewActivities />} />
          <Route path="forms" element={<OverviewForms />} />
          <Route path="people" element={<OverviewPeople />} />
        </Route>

        <Route path="student-dashboard" element={<StudentDashboardLayout />}>
          <Route index element={<Navigate to="all" replace />} />
          <Route path="all" element={<StudentMasterlist level="All" />} />
          <Route path="independent" element={<StudentMasterlist level="Independent" />} />
          <Route path="instructional" element={<StudentMasterlist level="Instructional" />} />
          <Route path="frustrational" element={<StudentMasterlist level="Frustrational" />} />
          <Route path="pending" element={<StudentMasterlist level="Pending" />} />
        </Route>
        <Route path="student-dashboard/students/:lrn" element={<StudentProfile />} />

        <Route path="phil-iri-records" element={<PhilIriLayout />}>
          <Route index element={<Navigate to="form-1a" replace />} />
          <Route path="form-1a" element={<PhilIriForm1 language="fil" />} />
          <Route path="form-1b" element={<PhilIriForm1 language="en" />} />
          <Route path="form-2" element={<PhilIriForm2 />} />
          <Route path="form-3a" element={<PhilIriForm3List formKey="form-3a" label="FORM 3A" />} />
          <Route path="form-3b" element={<PhilIriForm3List formKey="form-3b" label="FORM 3B" />} />
          <Route path="form-4" element={<PhilIriForm3List formKey="form-4" label="FORM 4" />} />
        </Route>
        <Route
          path="phil-iri-records/form-3a/:lrn"
          element={
            <PhilIriForm3Detail formKey="form-3a" label="FORM 3A" backTo="/teacher/phil-iri-records/form-3a" />
          }
        />
        <Route
          path="phil-iri-records/form-3b/:lrn"
          element={
            <PhilIriForm3Detail formKey="form-3b" label="FORM 3B" backTo="/teacher/phil-iri-records/form-3b" />
          }
        />
        <Route path="phil-iri-records/form-4/:lrn" element={<PhilIriForm4Detail />} />
        <Route path="phil-iri-records/export-success" element={<PhilIriExportSuccess />} />
        <Route path="phil-iri-passages" element={<PhilIriPassageBank />} />

        {/* Class Activities Sub-System */}
        <Route path="class-activities" element={<Navigate to="phil-iri" replace />} />
        <Route path="class-activities/phil-iri" element={<ClassActivities />} />
        <Route path="class-activities/practice" element={<ClassActivities />} />

        {/* Phil-IRI Assessment Routes */}
        <Route path="class-activities/phil-iri/assign" element={<PhilIriAssignPage />} />
        <Route path="class-activities/phil-iri/edit/:editId" element={<PhilIriAssignPage />} />
        <Route path="class-activities/phil-iri/view/:id" element={<ActivityDetailPage />} />

        {/* Practice Activity Routes */}
        <Route path="class-activities/practice/create" element={<ActivityFormPage />} />
        <Route path="class-activities/practice/edit/:id" element={<ActivityFormPage />} />
        <Route path="class-activities/practice/success" element={<ActivitySuccess />} />

        {/* Backwards-Compatible Route Aliases */}
        <Route path="class-activities/assign-phil-iri" element={<PhilIriAssignPage />} />
        <Route path="class-activities/assign-phil-iri/:editId" element={<PhilIriAssignPage />} />
        <Route path="class-activities/detail/:id" element={<ActivityDetailPage />} />
        <Route path="class-activities/new" element={<ActivityFormPage />} />
        <Route path="class-activities/success" element={<ActivitySuccess />} />
        <Route path="class-activities/:id/edit" element={<ActivityFormPage />} />

        <Route path="account" element={<AccountSettings />} />
        <Route path="account/:tab" element={<AccountSettings />} />
        <Route path="account/avatar" element={<EditAvatar />} />
        <Route path="notifications" element={<TeacherNotifications />} />
        <Route path="grade-level" element={<Navigate to="sections" replace />} />
        <Route path="grade-level/sections" element={<GradeLevelPage />} />
        <Route path="grade-level/faculty" element={<GradeLevelPage />} />
        <Route path="grade-level/students" element={<GradeLevelPage />} />
        <Route path="grade-level/people" element={<Navigate to="../students" replace />} />
        <Route path="grade-level/students/:lrn" element={<StudentProfile />} />
        <Route path="grade-level/faculty/:id" element={<FicTeacherProfilePage />} />
      </Route>
    </Routes>
  );
}
