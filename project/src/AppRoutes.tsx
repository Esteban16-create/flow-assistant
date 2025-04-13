import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import Progress from './pages/Progress';
import MentalClarity from './pages/MentalClarity';
import Vision from './pages/Vision';
import Profile from './pages/Profile';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ResetPassword from './pages/ResetPassword';
import ResetPasswordConfirmed from './pages/ResetPasswordConfirmed';
import UpdatePassword from './pages/UpdatePassword';
import ExpiredLink from './pages/ExpiredLink';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Routines from './pages/Routines';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset-password-confirmed" element={<ResetPasswordConfirmed />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/expired-link" element={<ExpiredLink />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/mental-clarity" element={<MentalClarity />} />
          <Route path="/routines" element={<Routines />} />
          <Route path="/vision" element={<Vision />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}