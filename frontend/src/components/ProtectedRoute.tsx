import { Navigate, Outlet } from 'react-router-dom';
import { USER_TOKEN_STORAGE_KEY } from '@/lib/api';

export default function ProtectedRoute() {
  const token = window.localStorage.getItem(USER_TOKEN_STORAGE_KEY);
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return <Outlet />;
}
