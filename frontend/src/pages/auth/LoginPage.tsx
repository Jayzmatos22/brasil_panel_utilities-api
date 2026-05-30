import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, LoaderCircle } from 'lucide-react';
import { authService } from '../../api/services/Auth';
import type { LoginRequest, AuthResponse } from '../../types/UserType';
import { BrandLogo } from '../../components/brand/BrandLogo';

// ─── Lista de features exibida no painel esquerdo ────────────────────────────
const FEATURES = [
  'Indicadores do Banco Central (BCB)',
  'Cotações de ações e metais preciosos',
  'Câmbio, criptomoedas e PTAX',
  'Dados do IBGE, IPEA e lista de bancos',
];

// ─── Estilos reutilizáveis ───────────────────────────────────────────────────
const inputClass = [
  'w-full h-12 px-4 rounded-lg bg-slate-800 text-white text-sm',
  'placeholder-slate-500 border border-slate-700',
  'outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30',
  'transition-all disabled:opacity-50',
].join(' ');

// ─── Componente ──────────────────────────────────────────────────────────────
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

      {/* ── Painel esquerdo — Marca ──────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12
                      bg-slate-900 border-r border-slate-800">

        <BrandLogo textSize="text-lg" iconSize={30} />

        <div className="flex flex-col gap-6 max-w-sm">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Dados econômicos do{' '}
              <span className="text-amber-400">Brasil</span>{' '}
              em um só lugar.
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Indicadores oficiais, cotações ao vivo e séries históricas
              reunidos em um painel limpo e rápido.
            </p>
          </div>

          <ul className="flex flex-col gap-3 mt-2">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center
                                 justify-center shrink-0">
                  <Check size={11} className="text-emerald-400" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-slate-700 text-xs">
          Brasil Panel © {new Date().getFullYear()} — Dados em tempo real
        </p>
      </div>

      {/* ── Painel direito — Formulário ──────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Logo no mobile */}
          <div className="flex justify-center lg:hidden">
            <BrandLogo textSize="text-xl" iconSize={30} />
          </div>

          {/* Título do form */}
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white">Bem-vindo de volta</h2>
            <p className="text-slate-500 text-sm">
              Entre com suas credenciais para acessar o painel.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="login-email" className="text-slate-300 text-sm font-medium">
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                className={inputClass}
                placeholder="seu@email.com"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="login-password" className="text-slate-300 text-sm font-medium">
                Senha
              </label>
              <input
                id="login-password"
                type="password"
                className={inputClass}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isPending}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-12 mt-2 bg-amber-500 hover:bg-amber-400
                         text-slate-950 font-bold rounded-lg transition-all
                         active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {isPending
                ? <><LoaderCircle size={15} className="animate-spin" /> Entrando…</>
                : 'Entrar no painel'
              }
            </button>
          </form>

          {/* Link para cadastro */}
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