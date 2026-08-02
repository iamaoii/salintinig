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
import StudentDashboardLayout from './pages/dashboard/student/StudentDashboardLayout.jsx';
import StudentMasterlist from './pages/dashboard/student/StudentMasterlist.jsx';
import StudentProfile from './pages/dashboard/student/StudentProfile.jsx';
import ClassActivities from './pages/dashboard/activities/ClassActivities.jsx';
import ActivityFormPage from './pages/dashboard/activities/ActivityFormPage.jsx';
import ActivitySuccess from './pages/dashboard/activities/ActivitySuccess.jsx';
import PhilIriLayout from './pages/dashboard/phil-iri/PhilIriLayout.jsx';
import PhilIriForm1 from './pages/dashboard/phil-iri/PhilIriForm1.jsx';
import PhilIriForm2 from './pages/dashboard/phil-iri/PhilIriForm2.jsx';
import PhilIriForm3List from './pages/dashboard/phil-iri/PhilIriForm3List.jsx';
import PhilIriForm3Detail from './pages/dashboard/phil-iri/PhilIriForm3Detail.jsx';
import PhilIriForm4Detail from './pages/dashboard/phil-iri/PhilIriForm4Detail.jsx';
import PhilIriExportSuccess from './pages/dashboard/phil-iri/PhilIriExportSuccess.jsx';

import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboardHome from './pages/admin/AdminDashboardHome.jsx';
import AdminStudentRecords from './pages/admin/AdminStudentRecords.jsx';
import AdminStudentProfile from './pages/admin/AdminStudentProfile.jsx';
import AdminTeacherRecords from './pages/admin/AdminTeacherRecords.jsx';
import TeacherProfile from './pages/admin/TeacherProfile.jsx';
import AdminFacultyAssignment from './pages/admin/AdminFacultyAssignment.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminProfile from './pages/admin/AdminProfile.jsx';

function HomeRedirect() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  const role = getUserRole();
  return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
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

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardHome />} />
        <Route path="students" element={<AdminStudentRecords />} />
        <Route path="students/:lrn" element={<AdminStudentProfile />} />
        <Route path="teachers" element={<AdminTeacherRecords />} />
        <Route path="teachers/:id" element={<TeacherProfile />} />
        <Route path="faculty-assignment" element={<AdminFacultyAssignment />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
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
            <PhilIriForm3Detail formKey="form-3a" label="FORM 3A" backTo="/dashboard/phil-iri-records/form-3a" />
          }
        />
        <Route
          path="phil-iri-records/form-3b/:lrn"
          element={
            <PhilIriForm3Detail formKey="form-3b" label="FORM 3B" backTo="/dashboard/phil-iri-records/form-3b" />
          }
        />
        <Route path="phil-iri-records/form-4/:lrn" element={<PhilIriForm4Detail />} />
        <Route path="phil-iri-records/export-success" element={<PhilIriExportSuccess />} />

        <Route path="class-activities" element={<ClassActivities />} />
        <Route path="class-activities/new" element={<ActivityFormPage />} />
        <Route path="class-activities/success" element={<ActivitySuccess />} />
        <Route path="class-activities/:id/edit" element={<ActivityFormPage />} />

        <Route path="account" element={<AccountSettings />} />
        <Route path="account/avatar" element={<EditAvatar />} />
      </Route>
    </Routes>
  );
}
