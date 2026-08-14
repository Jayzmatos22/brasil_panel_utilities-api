import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PerfilPage from './PerfilPage';
import { authService } from '../../api/services/Auth';
import type { ProfileResponse } from '../../types/UserType';

/**
 * A tela envia constantes de enum, não os rótulos que exibe. O backend valida
 * contra um CHECK no Postgres, então divergir aqui devolve 400 — e era
 * exatamente o estado anterior do código, que mandava "Tecnologia" em vez de
 * TECNOLOGIA (quando mandava alguma coisa: o submit não chamava a API).
 */

const PERFIL_VAZIO: ProfileResponse = {
  profession: null,
  area: null,
  educationLevel: null,
  institution: null,
  onboardingCompletedAt: null,
};

function renderizar() {
  // retry desligado: sem isso um teste de erro espera os backoffs do padrão.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dados-perfil']}>
        <Routes>
          <Route path="/dados-perfil" element={<PerfilPage />} />
          <Route path="/dashboard/economia" element={<p>painel</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('onboarding de perfil', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('envia as constantes do enum, não os rótulos exibidos', async () => {
    vi.spyOn(authService, 'getProfile').mockResolvedValue(PERFIL_VAZIO);
    const updateProfile = vi.spyOn(authService, 'updateProfile')
      .mockResolvedValue({ ...PERFIL_VAZIO, onboardingCompletedAt: '2026-08-14T19:03:11.482' });

    renderizar();

    const profissao = await screen.findByLabelText(/Profissão/);
    await userEvent.type(profissao, 'Analista de dados');
    // O usuário escolhe pelo rótulo; o que trafega é o value.
    await userEvent.selectOptions(screen.getByLabelText(/Área de atuação/), 'TECNOLOGIA');
    await userEvent.selectOptions(screen.getByLabelText(/Escolaridade/), 'SUPERIOR_COMPLETO');

    await userEvent.click(screen.getByRole('button', { name: /Salvar perfil/ }));

    // Só o primeiro argumento: o React Query repassa contexto próprio no
    // segundo, que não faz parte do contrato com a API.
    await waitFor(() => expect(updateProfile).toHaveBeenCalledOnce());
    expect(updateProfile.mock.calls[0][0]).toEqual({
      profession: 'Analista de dados',
      area: 'TECNOLOGIA',
      educationLevel: 'SUPERIOR_COMPLETO',
      institution: null,
    });
  });

  it('instituição em branco vai como null, não como string vazia', async () => {
    vi.spyOn(authService, 'getProfile').mockResolvedValue(PERFIL_VAZIO);
    const updateProfile = vi.spyOn(authService, 'updateProfile')
      .mockResolvedValue({ ...PERFIL_VAZIO, onboardingCompletedAt: '2026-08-14T19:03:11.482' });

    renderizar();

    await userEvent.type(await screen.findByLabelText(/Profissão/), 'Professor');
    await userEvent.selectOptions(screen.getByLabelText(/Escolaridade/), 'MESTRADO_DOUTORADO');
    await userEvent.type(screen.getByLabelText(/Instituição/), '   ');

    await userEvent.click(screen.getByRole('button', { name: /Salvar perfil/ }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledOnce());
    expect(updateProfile.mock.calls[0][0]).toMatchObject({
      institution: null,
      area: null,
    });
  });

  it('não chama a API nem navega quando a profissão está vazia', async () => {
    vi.spyOn(authService, 'getProfile').mockResolvedValue(PERFIL_VAZIO);
    const updateProfile = vi.spyOn(authService, 'updateProfile');

    renderizar();

    await screen.findByLabelText(/Profissão/);
    await userEvent.selectOptions(screen.getByLabelText(/Escolaridade/), 'ENSINO_MEDIO');
    await userEvent.click(screen.getByRole('button', { name: /Salvar perfil/ }));

    expect(updateProfile).not.toHaveBeenCalled();
    expect(screen.queryByText('painel')).not.toBeInTheDocument();
  });

  it('só navega para o painel depois que o servidor confirma', async () => {
    vi.spyOn(authService, 'getProfile').mockResolvedValue(PERFIL_VAZIO);
    // Regressão do estado anterior: a tela exibia "Perfil salvo!" e navegava
    // sem nada ter saído do componente. Com o servidor recusando, ninguém sai
    // da tela e o preenchimento não se perde.
    vi.spyOn(authService, 'updateProfile').mockRejectedValue(new Error('400'));

    renderizar();

    await userEvent.type(await screen.findByLabelText(/Profissão/), 'Analista');
    await userEvent.selectOptions(screen.getByLabelText(/Escolaridade/), 'ENSINO_MEDIO');
    await userEvent.click(screen.getByRole('button', { name: /Salvar perfil/ }));

    await waitFor(() => {
      expect(screen.queryByText('painel')).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Profissão/)).toHaveValue('Analista');
  });

  it('perfil já preenchido abre com os valores carregados e sem "pular"', async () => {
    vi.spyOn(authService, 'getProfile').mockResolvedValue({
      profession: 'Analista de dados',
      area: 'TECNOLOGIA',
      educationLevel: 'SUPERIOR_COMPLETO',
      institution: 'UFBA',
      onboardingCompletedAt: '2026-08-14T19:03:11.482',
    });
    const skipOnboarding = vi.spyOn(authService, 'skipOnboarding');

    renderizar();

    expect(await screen.findByLabelText(/Profissão/)).toHaveValue('Analista de dados');
    expect(screen.getByLabelText(/Escolaridade/)).toHaveValue('SUPERIOR_COMPLETO');

    // Quem já concluiu vê "Cancelar": repetir o skip seria requisição sem efeito.
    expect(screen.queryByRole('button', { name: /Pular por agora/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/ }));
    expect(skipOnboarding).not.toHaveBeenCalled();
  });

  it('pular encerra a etapa no servidor antes de ir ao painel', async () => {
    vi.spyOn(authService, 'getProfile').mockResolvedValue(PERFIL_VAZIO);
    const skipOnboarding = vi.spyOn(authService, 'skipOnboarding').mockResolvedValue();

    renderizar();

    await userEvent.click(await screen.findByRole('button', { name: /Pular por agora/ }));

    await waitFor(() => expect(skipOnboarding).toHaveBeenCalledOnce());
    expect(await screen.findByText('painel')).toBeInTheDocument();
  });

  it('falha ao carregar o perfil abre o formulário em vez de travar a tela', async () => {
    // Falha aberta: a consulta é conveniência de preenchimento, não pré-requisito.
    vi.spyOn(authService, 'getProfile').mockRejectedValue(new Error('500'));

    renderizar();

    expect(await screen.findByLabelText(/Profissão/)).toHaveValue('');
  });
});
