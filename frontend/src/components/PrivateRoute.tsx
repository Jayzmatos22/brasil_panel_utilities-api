import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth/jwt';

/**
 * Protege rotas que exigem autenticação.
 * Verifica presença do token E se ele ainda não expirou (via campo exp do payload).
 *
 * Ao barrar, guarda o caminho pretendido em `state.from` para que o login
 * devolva a pessoa exatamente onde ela tentou entrar. Sem isso, quem abre um
 * link para /dashboard/moedas/cambio faz login e cai na tela de economia,
 * tendo de refazer a navegação a partir do zero.
 */
export function PrivateRoute() {
  const location = useLocation();

  if (isAuthenticated()) return <Outlet />;

  return (
    <Navigate
      to="/login-usuario"
      replace
      state={{ from: `${location.pathname}${location.search}${location.hash}` }}
    />
  );
}