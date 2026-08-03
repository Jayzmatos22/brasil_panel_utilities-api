import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { isAuthenticated } from '../lib/auth/jwt';

/**
 * Espelho do PrivateRoute: barra quem JÁ está autenticado.
 *
 * Usado só na raiz. Quem já tem sessão não precisa da landing de conversão —
 * mandar essa pessoa para o painel é o comportamento esperado de qualquer
 * app com porta de entrada institucional.
 *
 * Recebe `children` em vez de usar <Outlet /> porque envolve uma rota única,
 * e não um grupo de rotas aninhadas como o PrivateRoute.
 *
 * Atenção: /sobre NÃO passa por aqui de propósito. A página institucional
 * precisa continuar acessível a quem está logado (é o destino do link
 * "Sobre" da sidebar); só a raiz é que redireciona.
 */
export function PublicOnly({ children }: { children: ReactNode }) {
  return isAuthenticated() ? (
    <Navigate to="/dashboard/economia" replace />
  ) : (
    children
  );
}