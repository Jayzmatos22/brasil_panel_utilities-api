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
import { AuthBackdrop } from './AuthBackdrop';
import { AuthTestingNotice, AuthAboutLink } from './AuthNotices';
import { limparNome, nomeValido } from '../../lib/validation/nome';
import { SENHA_FRACA, senhaForte } from '../../lib/validation/senha';

const VALID_EMAIL    = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function RegisterPage() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (_, variables) => {
      toast.success('Código enviado! Verifique seu e-mail.');
      // Passa o e-mail via state para a página de verificação
      navigate('/verificar-email', { replace: true, state: { email: variables.email } });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Erro ao cadastrar. Tente novamente.');
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // A mensagem diz o que falta, e não só que algo está errado: "nome completo" não
    // informa que o problema é a ausência do sobrenome.
    if (!nomeValido(name)) { toast.error('Digite seu nome (mínimo 3 letras).'); return; }
    if (!VALID_EMAIL.test(email))       { toast.error('E-mail inválido.'); return; }
    if (!senhaForte(password)) { toast.error(SENHA_FRACA); return; }
    // Envia normalizado: sem isso o espaço sobrando seria gravado no banco e voltaria
    // no cabeçalho do painel.
    mutate({ name: limparNome(name), email, password });
  };

  return (
    // Ver LoginPage para o porquê de `app-shell` e `bg-smoke-abyss`.
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
            <h2 className="text-2xl font-bold text-white">Crie sua conta</h2>
            <p className="text-slate-400 text-sm">
              Preencha os dados abaixo para começar gratuitamente.
            </p>
          </div>

          <AuthTestingNotice />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField
              id="reg-name"
              label="Nome"
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
              <span className="text-slate-400">Já tem conta?</span>
              <button
                type="button"
                onClick={() => navigate('/login-usuario')}
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer rounded-control px-2 coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
              >
                Entrar no painel
              </button>
            </div>

            <AuthAboutLink />

          </div>

        </div>
      </div>

    </div>
  );
}