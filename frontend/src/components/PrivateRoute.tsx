import { Navigate, Outlet } from 'react-router-dom';

/**
 * Protege rotas que exigem autenticação.
 * Se não houver token no localStorage, redireciona para /login-usuario.
 */
export function PrivateRoute() {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login-usuario" replace />;
}