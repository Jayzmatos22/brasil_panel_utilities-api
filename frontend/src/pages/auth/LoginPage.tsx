import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authService } from '../../api/services/Auth';
import type { LoginRequest, AuthResponse } from '../../types/UserType';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { FormField } from '../../components/forms/FormField';
import { SubmitButton } from '../../components/forms/SubmitButton';
import { AuthBrandPanel } from '../../components/forms/AuthBrandPanel';
import { AuthBackdrop } from './AuthBackdrop';
import { AuthTestingNotice, AuthAboutLink } from './AuthNotices';
import { saveSession } from '../../lib/auth/jwt';
import { resolveRedirect } from '../../lib/auth/redirect';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Destino pretendido antes de o guard barrar a entrada. Fora do onSuccess
  // de propósito: lido no render, não dentro do callback, para não depender
  // do que o state da navegação será dali a 900ms.
  const { state } = useLocation();
  const redirectTo = resolveRedirect(state);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (res: AuthResponse) => {
      // O JWT já veio em cookie httpOnly; aqui guardamos só o hint de exibição.
      saveSession(res.email, res.role, res.expiresInMs, res.name);
      toast.success('Login realizado com sucesso!');
      // `replace` para que o botão Voltar não traga a pessoa de volta ao
      // login já autenticada.
      setTimeout(() => navigate(redirectTo, { replace: true }), 900);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Credenciais inválidas. Tente novamente.');
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Preencha todos os campos.');
      return;
    }
    mutate({ email, password });
  };

  return (
    // `app-shell` (100svh com fallback) e não `min-h-screen`: esta tela é curta,
    // e é nela que `100vh` mais custa — a janela medida com a barra de endereço
    // recolhida dá ao documento uma rolagem fantasma do tamanho da barra.
    //
    // `bg-smoke-abyss` traz o fundo do resto do app para cá. Era `bg-slate-950`,
    // uma cor sólida que não existe em nenhuma outra tela; agora Registro e
    // Login respiram a mesma atmosfera do painel e da landing.
    <div className="app-shell flex bg-smoke-abyss">

      <AuthBackdrop />

      <AuthBrandPanel />

      {/* Painel direito — formulário. `relative z-10` o mantém acima da arte. */}
      <div className="relative z-10 flex-1 min-w-0 flex items-center justify-center px-gutter py-8">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Logo no mobile */}
          <div className="flex justify-center lg:hidden">
            <BrandLogo variant="sidebar" />
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white">Bem-vindo de volta</h2>
            <p className="text-slate-400 text-sm">
              Entre com suas credenciais para acessar o painel.
            </p>
          </div>

          <AuthTestingNotice />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField
              id="login-email"
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isPending}
            />
            <FormField
              id="login-password"
              label="Senha"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isPending}
            />
            <SubmitButton
              isPending={isPending}
              label="Entrar no painel"
              pendingLabel="Entrando…"
            />
          </form>

          {/* Rodapé em pilha: a alternância entre as duas telas e o link
              institucional. Juntos num só bloco com gap próprio — soltos na
              coluna eles herdariam o gap-8 do pai, que é espaço de SEÇÃO e
              deixaria os dois parecendo assuntos separados. */}
          <div className="flex flex-col items-center gap-3">

            <div className="flex items-center justify-center gap-2 text-sm">
              {/* slate-400, e não o slate-500 que estava aqui: sobre qualquer
                  fundo o slate-500 fica em ~4,2:1, abaixo do AA de 4,5 — a
                  mesma falha já corrigida no subtítulo destas telas. E o link
                  vizinho é slate-400, então os dois precisam bater. */}
              <span className="text-slate-400">Não tem conta?</span>
              <button
                type="button"
                onClick={() => navigate('/registro-usuario')}
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer rounded-control px-2 coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
              >
                Criar conta grátis
              </button>
            </div>

            <AuthAboutLink />

          </div>

        </div>
      </div>

    </div>
  );
}