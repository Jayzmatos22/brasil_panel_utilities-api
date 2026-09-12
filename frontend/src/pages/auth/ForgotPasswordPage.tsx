import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { KeyRound } from 'lucide-react';
import { authService } from '../../api/services/Auth';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { FormField } from '../../components/forms/FormField';
import { SubmitButton } from '../../components/forms/SubmitButton';
import { AuthBrandPanel } from '../../components/forms/AuthBrandPanel';
import { AuthBackdrop } from './AuthBackdrop';

/**
 * Pedido de recuperação de senha.
 *
 * <p>Segue para a tela do código em qualquer caso, inclusive quando o e-mail não tem
 * cadastro. Parar aqui com "conta não encontrada" contaria a quem digitou quais endereços
 * existem — e o backend já responde igual para os dois casos justamente para isso.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: () => authService.forgotPassword({ email: email.trim() }),
    onSuccess: (res) => {
      toast.success(res.message);
      navigate('/redefinir-senha', { state: { email: email.trim() } });
    },
    onError: (err: Error) => toast.error(err.message ?? 'Não foi possível enviar o código.'),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Informe seu e-mail.');
      return;
    }
    mutate();
  };

  return (
    <div className="app-shell flex bg-smoke-abyss">
      <AuthBackdrop />
      <AuthBrandPanel />

      <div className="relative z-10 flex-1 min-w-0 flex items-center justify-center px-gutter py-8">
        <div className="w-full max-w-md flex flex-col gap-8">

          <div className="flex justify-center lg:hidden">
            <BrandLogo variant="sidebar" />
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
              <KeyRound size={28} className="text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Esqueceu a senha?</h2>
            <p className="text-slate-400 text-sm max-w-xs">
              Informe seu e-mail e enviaremos um código de 6 dígitos para você definir
              uma senha nova.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField
              id="forgot-email"
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
            />
            <SubmitButton
              isPending={isPending}
              label="Enviar código"
              pendingLabel="Enviando…"
            />
          </form>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/login-usuario')}
              className="text-fg-dim hover:text-slate-300 text-sm transition-colors cursor-pointer rounded-control px-2 coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
            >
              Voltar para o login
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
