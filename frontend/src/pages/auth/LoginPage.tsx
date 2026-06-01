import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authService } from '../../api/services/Auth';
import type { LoginRequest, AuthResponse } from '../../types/UserType';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { FormField } from '../../components/forms/FormField';
import { SubmitButton } from '../../components/forms/SubmitButton';
import { AuthBrandPanel } from '../../components/forms/AuthBrandPanel';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (res: AuthResponse) => {
      localStorage.setItem('token', res.token);
      toast.success('Login realizado com sucesso!');
      setTimeout(() => navigate('/dashboard/economia', { replace: true }), 900);
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
    <div className="min-h-screen flex bg-slate-950">

      <AuthBrandPanel />

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Logo no mobile */}
          <div className="flex justify-center lg:hidden">
            <BrandLogo variant="sidebar" />
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white">Bem-vindo de volta</h2>
            <p className="text-slate-500 text-sm">
              Entre com suas credenciais para acessar o painel.
            </p>
          </div>

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

          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-slate-500">Não tem conta?</span>
            <button
              type="button"
              onClick={() => navigate('/registro-usuario')}
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer"
            >
              Criar conta grátis
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}