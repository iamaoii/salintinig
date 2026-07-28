import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import ForgotPasswordEmail from './pages/ForgotPasswordEmail.jsx';
import EnterCode from './pages/EnterCode.jsx';
import EnterNewPassword from './pages/EnterNewPassword.jsx';
import PasswordChangedSuccess from './pages/PasswordChangedSuccess.jsx';
import SignupEmail from './pages/SignupEmail.jsx';
import RequestSent from './pages/RequestSent.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { isLoggedIn } from './lib/auth.js';

import DashboardLayout from './pages/dashboard/DashboardLayout.jsx';
import OverviewLayout from './pages/dashboard/OverviewLayout.jsx';
import OverviewActivities from './pages/dashboard/OverviewActivities.jsx';
import OverviewForms from './pages/dashboard/OverviewForms.jsx';
import OverviewPeople from './pages/dashboard/OverviewPeople.jsx';
import AccountSettings from './pages/dashboard/AccountSettings.jsx';
import EditAvatar from './pages/dashboard/EditAvatar.jsx';
import StudentDashboardLayout from './pages/dashboard/StudentDashboardLayout.jsx';
import StudentMasterlist from './pages/dashboard/StudentMasterlist.jsx';
import StudentProfile from './pages/dashboard/StudentProfile.jsx';
import ClassActivities from './pages/dashboard/ClassActivities.jsx';
import ActivityFormPage from './pages/dashboard/ActivityFormPage.jsx';
import ActivitySuccess from './pages/dashboard/ActivitySuccess.jsx';
import PhilIriLayout from './pages/dashboard/PhilIriLayout.jsx';
import PhilIriForm1 from './pages/dashboard/PhilIriForm1.jsx';
import PhilIriForm2 from './pages/dashboard/PhilIriForm2.jsx';
import PhilIriForm3List from './pages/dashboard/PhilIriForm3List.jsx';
import PhilIriForm3Detail from './pages/dashboard/PhilIriForm3Detail.jsx';
import PhilIriForm4Detail from './pages/dashboard/PhilIriForm4Detail.jsx';
import PhilIriExportSuccess from './pages/dashboard/PhilIriExportSuccess.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={isLoggedIn() ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPasswordEmail />} />
      <Route path="/forgot-password/code" element={<EnterCode />} />
      <Route path="/forgot-password/new-password" element={<EnterNewPassword />} />
      <Route path="/forgot-password/success" element={<PasswordChangedSuccess />} />
      <Route path="/signup" element={<SignupEmail />} />
      <Route path="/signup/success" element={<RequestSent />} />

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
          <Route index element={<Navigate to="activities" replace />} />
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
