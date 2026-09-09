import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { SENHA_FRACA, senhaForte } from '../../lib/validation/senha';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { authService } from '../../api/services/Auth';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { FormField } from '../../components/forms/FormField';
import { SubmitButton } from '../../components/forms/SubmitButton';
import { AuthBrandPanel } from '../../components/forms/AuthBrandPanel';
import { AuthBackdrop } from './AuthBackdrop';

const DIGITS = 6;

/** Redefinição da senha com o código recebido por e-mail. */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email: string = location.state?.email ?? '';

  const [digits, setDigits] = useState<string[]>(Array(DIGITS).fill(''));
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Acesso direto à rota: sem o e-mail não há o que redefinir.
  useEffect(() => {
    if (!email) navigate('/esqueci-senha', { replace: true });
  }, [email, navigate]);

  const code = digits.join('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => authService.resetPassword({ email, code, newPassword: senha }),
    onSuccess: () => {
      // A redefinição carimba passwordChangedAt e invalida todo token anterior; não há
      // sessão para aproveitar aqui. Manda para o login, com a senha nova em mãos.
      toast.success('Senha redefinida. Entre com a senha nova.');
      navigate('/login-usuario', { replace: true });
    },
    onError: (err: Error) => {
      setDigits(Array(DIGITS).fill(''));
      inputsRef.current[0]?.focus();
      toast.error(err.message ?? 'Código inválido ou expirado.');
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== DIGITS) {
      toast.error('Digite os 6 dígitos do código.');
      return;
    }
    // Mesma exigência do cadastro: sem isto dava para definir por aqui uma senha que o
    // cadastro recusaria — e a recuperação vira o caminho fácil para a senha fraca.
    if (!senhaForte(senha)) {
      toast.error(SENHA_FRACA);
      return;
    }
    if (senha !== confirmacao) {
      toast.error('As senhas não coincidem.');
      return;
    }
    mutate();
  };

  const handleChange = (i: number, val: string) => {
    const digito = val.replace(/\D/g, '').slice(-1);
    const proximo = [...digits];
    proximo[i] = digito;
    setDigits(proximo);
    if (digito && i < DIGITS - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const colado = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGITS);
    if (!colado) return;
    const proximo = [...digits];
    colado.split('').forEach((d, i) => { proximo[i] = d; });
    setDigits(proximo);
    const vazio = proximo.findIndex((d) => !d);
    inputsRef.current[vazio !== -1 ? vazio : DIGITS - 1]?.focus();
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
              <ShieldCheck size={28} className="text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Definir nova senha</h2>
            <p className="text-slate-400 text-sm max-w-xs">
              Enviamos um código para{' '}
              <span className="text-white font-medium">{email}</span>, se houver conta
              para ele. O código expira em 15 minutos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            <div className="flex justify-center gap-3">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  disabled={isPending}
                  aria-label={`Dígito ${i + 1} de ${DIGITS}`}
                  className="w-12 h-14 text-center text-xl font-bold rounded-lg
                             bg-slate-800 border border-slate-700 text-white
                             outline-none focus:border-amber-500 focus:ring-1
                             focus:ring-amber-500/30 transition-all disabled:opacity-50
                             caret-transparent"
                />
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <FormField
                id="reset-password"
                label="Nova senha"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={isPending}
              />
              <FormField
                id="reset-password-confirm"
                label="Confirmar nova senha"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                disabled={isPending}
              />
            </div>

            <SubmitButton
              isPending={isPending}
              label="Redefinir senha"
              pendingLabel="Redefinindo…"
            />
          </form>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/esqueci-senha', { replace: true })}
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors cursor-pointer rounded-control px-2 coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
            >
              Não recebeu? Pedir outro código
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
