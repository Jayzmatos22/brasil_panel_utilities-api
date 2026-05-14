import { Database } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { type User } from '../types/UserType';

export default function LoginData() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    const storedUsers = localStorage.getItem('db_users');
    if (!storedUsers) {
      toast.error('Nenhum usuário cadastrado');
      return;
    }

    const users: User[] = JSON.parse(storedUsers);
    const foundUser = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!foundUser) {
      toast.error('Email ou senha incorretos');
      return;
    }

    localStorage.setItem('currentUser', JSON.stringify(foundUser));
    toast.success(`Bem-vindo, ${foundUser.name}!`);
    navigate('/dashboard');
  };

  return (
    <form onSubmit={handleLogin} className="border-gray-500 border w-full max-w-md min-h-[450px] shadow-2xl flex flex-col p-10 rounded-xl bg-slate-900">
      
      <div className="w-full flex items-center justify-center text-center mb-10">
        <h2 className="text-white register-font text-2xl flex items-center gap-3 tracking-wider">
          <Database size={28} className="database-icon" />
          Dados de Login 
        </h2>
      </div>

      <div className="flex w-full flex-col gap-5">
        
        <div className="flex flex-col gap-2">
          <label htmlFor="login-email" className="text-white text-sm ml-1">Seu e-mail</label>
          <input 
            id="login-email"
            className="w-full h-12 p-3 rounded-md bg-data-input text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all border border-slate-600" 
            type="email" 
            placeholder="seu@email.com" 
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="login-password" className="text-white text-sm ml-1">Informar senha</label>
          <input 
            id="login-password"
            className="w-full h-12 p-3 rounded-md bg-data-input text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all border border-slate-600" 
            type="password" 
            placeholder="••••••••"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="w-full h-14 mt-4 bg-yellow-500 hover:bg-yellow-800 cursor-pointer text-white font-bold rounded-md transition-all shadow-lg active:scale-95">
          Entrar
        </button>

        <button type="button" onClick={() => navigate('/registro-usuario')}
          className="w-full h-14 bg-red-500 hover:bg-red-950 cursor-pointer text-white font-bold rounded-md transition-all shadow-lg active:scale-95">
          Não tem conta ainda?
        </button>
      </div>
    </form>
  );
}