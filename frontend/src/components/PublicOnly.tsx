import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { isAuthenticated } from '../lib/auth/jwt';

/**
 * Espelho do PrivateRoute: barra quem JÁ está autenticado.
 *
 * Cobre a raiz e as telas de autenticação. Quem tem sessão não precisa da
 * landing de conversão nem de um formulário de login — o destino útil é o
 * painel. Vale inclusive para sessão aberta em outra aba, já que o hint de
 * sessão vive em localStorage e é compartilhado entre elas.
 *
 * O estado é um RETRATO DA MONTAGEM, não uma leitura a cada render, e isso é
 * essencial no /login-usuario: o LoginPage grava a sessão e só navega 900ms
 * depois, durante o toast de sucesso. Se o guard reavaliasse nessa janela,
 * veria a sessão recém-criada e redirecionaria para o painel — engolindo o
 * destino que o resolveRedirect calculou e desfazendo o retorno à página
 * pretendida.
 *
 * Recebe `children` em vez de usar <Outlet /> porque envolve rotas isoladas,
 * e não um grupo aninhado como o PrivateRoute.
 *
 * Atenção: /sobre NÃO passa por aqui de propósito. A página institucional
 * precisa continuar acessível a quem está logado (é o destino do link
 * "Sobre" da sidebar); lá quem se adapta à sessão são os próprios CTAs.
 */
export function PublicOnly({ children }: { children: ReactNode }) {
  const [wasAuthenticatedOnMount] = useState(isAuthenticated);

  return wasAuthenticatedOnMount ? (
    <Navigate to="/dashboard/economia" replace />
  ) : (
    children
  );
}