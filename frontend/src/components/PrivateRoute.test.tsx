import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdminRoute } from './AdminRoute';
import { PrivateRoute } from './PrivateRoute';
import { saveSession } from '../lib/auth/jwt';

/**
 * Os guards decidem o que renderizar, não o que é permitido — a autorização
 * real está no backend. Ainda assim, se quebrarem, o usuário fica preso fora do
 * painel mesmo com sessão válida.
 */
describe('guards de rota', () => {
  const UM_DIA_MS = 86_400_000;

  beforeEach(() => {
    localStorage.clear();
  });

  const renderizar = (Guard: () => React.ReactElement, rotaInicial = '/protegida') =>
    render(
      <MemoryRouter initialEntries={[rotaInicial]}>
        <Routes>
          <Route element={<Guard />}>
            <Route path="/protegida" element={<p>conteúdo protegido</p>} />
          </Route>
          <Route path="/login-usuario" element={<p>tela de login</p>} />
          <Route path="/dashboard/economia" element={<p>painel</p>} />
        </Routes>
      </MemoryRouter>,
    );

  describe('PrivateRoute', () => {
    it('libera o conteúdo com sessão válida', () => {
      saveSession('usuario@exemplo.com', 'USER', UM_DIA_MS);

      renderizar(PrivateRoute);

      expect(screen.getByText('conteúdo protegido')).toBeInTheDocument();
    });

    it('manda para o login sem sessão', () => {
      renderizar(PrivateRoute);

      expect(screen.getByText('tela de login')).toBeInTheDocument();
      expect(screen.queryByText('conteúdo protegido')).not.toBeInTheDocument();
    });

    it('manda para o login com sessão expirada', () => {
      saveSession('usuario@exemplo.com', 'USER', -1000);

      renderizar(PrivateRoute);

      expect(screen.getByText('tela de login')).toBeInTheDocument();
    });
  });

  describe('AdminRoute', () => {
    it('libera o conteúdo para ADMIN', () => {
      saveSession('admin@exemplo.com', 'ADMIN', UM_DIA_MS);

      renderizar(AdminRoute);

      expect(screen.getByText('conteúdo protegido')).toBeInTheDocument();
    });

    it('devolve o USER ao painel, sem mandá-lo ao login', () => {
      saveSession('usuario@exemplo.com', 'USER', UM_DIA_MS);

      renderizar(AdminRoute);

      // Está autenticado, só não é admin: mandá-lo ao login seria confuso.
      expect(screen.getByText('painel')).toBeInTheDocument();
      expect(screen.queryByText('tela de login')).not.toBeInTheDocument();
    });

    it('manda para o login quem não tem sessão', () => {
      renderizar(AdminRoute);

      expect(screen.getByText('tela de login')).toBeInTheDocument();
    });
  });
});