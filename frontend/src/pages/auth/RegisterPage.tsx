import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authService } from '../../api/services/Auth';
import type { RegisterRequest } from '../../types/UserType';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { FormField } from '../../components/forms/FormField';
import { SubmitButton } from '../../components/forms/SubmitButton';
import { AuthBrandPanel } from '../../components/forms/AuthBrandPanel';

const VALID_EMAIL    = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const VALID_NAME     = /^[a-zA-ZÀ-ÿ]{2,}(?:\s[a-zA-ZÀ-ÿ]+)+$/;
const VALID_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function RegisterPage() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: () => {
      toast.success('Cadastro realizado! Faça login para continuar.');
      setTimeout(() => navigate('/login-usuario', { replace: true }), 1500);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Erro ao cadastrar. Tente novamente.');
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!VALID_NAME.test(name))         { toast.error('Digite seu nome completo.'); return; }
    if (!VALID_EMAIL.test(email))       { toast.error('E-mail inválido.'); return; }
    if (!VALID_PASSWORD.test(password)) {
      toast.error('Senha fraca. Use maiúsculas, minúsculas, número e símbolo (@$!%*?&).');
      return;
    }
    mutate({ name, email, password });
  };

  return (
    <div className="min-h-screen flex bg-slate-950 ">

      <AuthBrandPanel />

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Logo no mobile */}
          <div className="flex justify-center lg:hidden">
            <BrandLogo variant="sidebar" />
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white">Crie sua conta</h2>
            <p className="text-slate-500 text-sm">
              Preencha os dados abaixo para começar gratuitamente.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField
              id="reg-name"
              label="Nome completo"
              placeholder="Nome Sobrenome"
              autoComplete="name"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isPending}
            />
            <FormField
              id="reg-email"
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isPending}
            />
            <FormField
              id="reg-password"
              label="Senha"
              type="password"
              placeholder="Mín. 8 caracteres com símbolo"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isPending}
              hint="Use letras maiúsculas, minúsculas, número e símbolo (@$!%*?&)."
            />
            <SubmitButton
              isPending={isPending}
              label="Criar conta grátis"
              pendingLabel="Cadastrando…"
            />
          </form>

          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-slate-500">Já tem conta?</span>
            <button
              type="button"
              onClick={() => navigate('/login-usuario')}
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer"
            >
              Entrar no painel
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}