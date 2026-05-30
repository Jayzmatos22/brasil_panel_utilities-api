import { useState, type FormEvent } from 'react';
import { Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authService } from '../../api/services/Auth';
import type { LoginRequest, AuthResponse } from '../../types/UserType';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (res: AuthResponse) => {
      localStorage.setItem('token', res.token);
      toast.success('Login realizado com sucesso!');
      setTimeout(() => navigate('/dados-endereco', { replace: true }), 1000);
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
            Dados de Login
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="login-email" className="text-white text-sm ml-1">
              Seu e-mail
            </label>
            <input
              id="login-email"
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
            <label htmlFor="login-password" className="text-white text-sm ml-1">
              Informar senha
            </label>
            <input
              id="login-password"
              className={inputClass}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
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
            {isPending ? 'Entrando...' : 'Entrar'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/registro-usuario')}
            disabled={isPending}
            className="w-full h-12 bg-red-500 hover:bg-red-700 cursor-pointer text-white font-bold rounded-md transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            Não tem conta ainda?
          </button>
        </div>
      </form>
    </main>
  );
}
