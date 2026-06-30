import { Route, Routes } from 'react-router-dom';
import AnalyticsTracker from './components/common/AnalyticsTracker';
import AdminLayout from './components/layout/AdminLayout';
import StudentLayout from './components/layout/StudentLayout';
import AdminRoute from './routes/AdminRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRedirect from './routes/RoleRedirect';
import ForgotPassword from './pages/auth/ForgotPassword';
import Login from './pages/auth/Login';
import Dashboard from './pages/student/Dashboard';
import Assignments from './pages/student/Assignments';
import CategoryPage from './pages/student/CategoryPage';
import Profile from './pages/student/Profile';
import ResourceDetail from './pages/student/ResourceDetail';
import ResourceSolve from './pages/student/ResourceSolve';
import SolvedTests from './pages/student/SolvedTests';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminAssignments from './pages/admin/AdminAssignments';
import AdminCategoryResources from './pages/admin/AdminCategoryResources';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminResourceDetail from './pages/admin/AdminResourceDetail';
import AdminResources from './pages/admin/AdminResources';
import AdminStudentDetail from './pages/admin/AdminStudentDetail';
import AdminStudents from './pages/admin/AdminStudents';
import EditResource from './pages/admin/EditResource';
import NewResource from './pages/admin/NewResource';

export default function App() {
  return (
    <>
      <AnalyticsTracker />
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<StudentLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/cozulen-testler" element={<SolvedTests />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/category/:category/publisher/:publisher" element={<CategoryPage />} />
            <Route path="/resource/:id" element={<ResourceDetail />} />
            <Route path="/resource/:id/solve" element={<ResourceSolve />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="resources" element={<AdminResources />} />
            <Route path="resources/view/:id" element={<AdminResourceDetail />} />
            <Route path="resources/:category" element={<AdminCategoryResources />} />
            <Route path="resources/:category/publisher/:publisher" element={<AdminCategoryResources />} />
            <Route path="resources/new" element={<NewResource />} />
            <Route path="resources/edit/:id" element={<EditResource />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="students/:id" element={<AdminStudentDetail />} />
            <Route path="assignments" element={<AdminAssignments />} />
            <Route path="accounts" element={<AdminAccounts />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
          </Route>
        </Route>

        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </>
  );
}
