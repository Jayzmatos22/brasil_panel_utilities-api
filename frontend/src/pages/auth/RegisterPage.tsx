import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, LoaderCircle } from 'lucide-react';
import { authService } from '../../api/services/Auth';
import type { RegisterRequest } from '../../types/UserType';
import { BrandLogo } from '../../components/brand/BrandLogo';

// ─── Validações ──────────────────────────────────────────────────────────────
const VALID_EMAIL    = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const VALID_NAME     = /^[a-zA-ZÀ-ÿ]{2,}(?:\s[a-zA-ZÀ-ÿ]+)+$/;
const VALID_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// ─── Features exibidas no painel esquerdo ────────────────────────────────────
const FEATURES = [
  'Indicadores do Banco Central (BCB)',
  'Cotações de ações e metais preciosos',
  'Câmbio, criptomoedas e PTAX',
  'Dados do IBGE, IPEA e lista de bancos',
];

// ─── Estilo dos inputs ───────────────────────────────────────────────────────
const inputClass = [
  'w-full h-12 px-4 rounded-lg bg-slate-800 text-white text-sm',
  'placeholder-slate-500 border border-slate-700',
  'outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30',
  'transition-all disabled:opacity-50',
].join(' ');

// ─── Componente ──────────────────────────────────────────────────────────────
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
    if (!VALID_NAME.test(name))           { toast.error('Digite seu nome completo.'); return; }
    if (!VALID_EMAIL.test(email))         { toast.error('E-mail inválido.'); return; }
    if (!VALID_PASSWORD.test(password))   {
      toast.error('Senha fraca. Use maiúsculas, minúsculas, número e símbolo (@$!%*?&).');
      return;
    }
    mutate({ name, email, password });
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

          {/* Título */}
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white">Crie sua conta</h2>
            <p className="text-slate-500 text-sm">
              Preencha os dados abaixo para começar gratuitamente.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-2">
              <label htmlFor="reg-name" className="text-slate-300 text-sm font-medium">
                Nome completo
              </label>
              <input
                id="reg-name"
                type="text"
                className={inputClass}
                placeholder="Nome Sobrenome"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="reg-email" className="text-slate-300 text-sm font-medium">
                E-mail
              </label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-password" className="text-slate-300 text-sm font-medium">
                Senha
              </label>
              <input
                id="reg-password"
                type="password"
                className={inputClass}
                placeholder="Mín. 8 caracteres com símbolo"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isPending}
              />
              <p className="text-slate-600 text-xs ml-0.5">
                Use letras maiúsculas, minúsculas, número e símbolo (@$!%*?&).
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-12 mt-1 bg-amber-500 hover:bg-amber-400
                         text-slate-950 font-bold rounded-lg transition-all
                         active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {isPending
                ? <><LoaderCircle size={15} className="animate-spin" /> Cadastrando…</>
                : 'Criar conta grátis'
              }
            </button>
          </form>

          {/* Link para login */}
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
