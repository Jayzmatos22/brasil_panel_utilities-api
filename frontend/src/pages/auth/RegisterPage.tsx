import { useState, type FormEvent } from 'react';
import { Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authService } from '../../api/services/Auth';
import type { RegisterRequest } from '../../types/UserType';

const VALID_EMAIL    = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const VALID_NAME     = /^[a-zA-ZÀ-ÿ]{2,}(?:\s[a-zA-ZÀ-ÿ]+)+$/;
const VALID_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function RegisterPage() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
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

    if (!VALID_EMAIL.test(email))    { toast.error('E-mail inválido.');           return; }
    if (!VALID_NAME.test(name))      { toast.error('Digite seu nome completo.');  return; }
    if (!VALID_PASSWORD.test(password)) { toast.error('Senha fraca. Use letras maiúsculas, minúsculas, número e símbolo.'); return; }

    mutate({ name, email, password });
  };

  const inputClass =
    'w-full h-12 p-3 rounded-md bg-data-input text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all border border-slate-600';

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <form
        onSubmit={handleSubmit}
        className="border border-gray-500 w-full max-w-md shadow-2xl flex flex-col p-10 rounded-xl bg-slate-900"
      >
        <div className="flex items-center justify-center mb-10">
          <h2 className="text-white text-2xl flex items-center gap-3 tracking-wider">
            <Database size={28} className="text-yellow-500" />
            Dados de Cadastro
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-white text-sm ml-1">Nome Completo</label>
            <input
              className={inputClass}
              type="text"
              placeholder="Ex: nome sobrenome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-white text-sm ml-1">Seu e-mail</label>
            <input
              className={inputClass}
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-white text-sm ml-1">Criar senha</label>
            <input
              className={inputClass}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-12 mt-4 bg-yellow-500 hover:bg-yellow-600 cursor-pointer text-white font-bold rounded-md transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Cadastrando...' : 'Cadastrar'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login-usuario')}
            disabled={isPending}
            className="w-full h-12 bg-red-500 hover:bg-red-700 cursor-pointer text-white font-bold rounded-md transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            Já tem conta?
          </button>
        </div>
      </form>
    </main>
  );
}
