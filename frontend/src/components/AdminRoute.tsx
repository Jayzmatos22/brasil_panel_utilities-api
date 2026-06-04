import { Navigate, Outlet } from 'react-router-dom';
import { isAdmin, isAuthenticated } from '../lib/auth/jwt';

/**
 * Protege rotas exclusivas de administrador.
 * Redireciona para login se não autenticado, ou para o dashboard se não for admin.
 */
export function AdminRoute() {
  if (!isAuthenticated()) return <Navigate to="/login-usuario" replace />;
  if (!isAdmin())         return <Navigate to="/dashboard/economia" replace />;
  return <Outlet />;
}