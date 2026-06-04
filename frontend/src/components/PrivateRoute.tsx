import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth/jwt';

/**
 * Protege rotas que exigem autenticação.
 * Verifica presença do token E se ele ainda não expirou (via campo exp do payload).
 */
export function PrivateRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login-usuario" replace />;
}