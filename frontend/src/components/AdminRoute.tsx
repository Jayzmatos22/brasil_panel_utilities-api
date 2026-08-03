import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAdmin, isAuthenticated } from '../lib/auth/jwt';

/**
 * Protege rotas exclusivas de administrador.
 * Redireciona para login se não autenticado, ou para o dashboard se não for admin.
 *
 * O `state.from` acompanha só o caso "sem sessão", igual ao PrivateRoute. O
 * USER autenticado que não é admin não deve ser devolvido a uma rota que ele
 * nunca vai conseguir abrir — para ele o destino certo é o painel.
 */
export function AdminRoute() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/login-usuario"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  if (!isAdmin()) return <Navigate to="/dashboard/economia" replace />;

  return <Outlet />;
}