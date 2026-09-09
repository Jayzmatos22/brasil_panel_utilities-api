import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { authService } from '../../api/services/Auth';
import type { AuthResponse } from '../../types/UserType';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { AuthBrandPanel } from '../../components/forms/AuthBrandPanel';
import { SubmitButton } from '../../components/forms/SubmitButton';
import { clearSession, saveSession } from '../../lib/auth/jwt';
import { clearPendingAdminLogin, getPendingAdminLogin } from '../../lib/auth/pendingAdminLogin';

const DIGITS = 6;

type Modo = 'login' | 'senha';

/**
 * Confirmação do segundo fator do admin — a etapa em que a senha deixa de bastar.
 *
 * <p>Serve às duas ações protegidas. Elas diferem no que já se tem em mãos: no
 * {@code login} ainda não há sessão, então as credenciais voltam junto do código; na
 * {@code senha} a sessão existe e o código sozinho basta.
 */
export default function AdminConfirmPage({ modo }: { modo: Modo }) {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(DIGITS).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const pendente = getPendingAdminLogin();

  // Acesso direto à rota, ou recarregamento que apagou as credenciais em memória:
  // não há o que confirmar, e insistir aqui só produziria um erro sem sentido.
  useEffect(() => {
    if (modo === 'login' && !pendente) {
      navigate('/login-usuario', { replace: true });
    }
  }, [modo, pendente, navigate]);

  const code = digits.join('');
  const completo = code.length === DIGITS;

  const { mutate: confirmarLogin, isPending: confirmandoLogin } = useMutation({
    mutationFn: () =>
      authService.confirmAdminLogin({
        email: pendente!.email,
        password: pendente!.password,
        code,
      }),
    onSuccess: (res: AuthResponse) => {
      clearPendingAdminLogin();
      saveSession(res.email, res.role, res.expiresInMs, res.name);
      toast.success('Acesso de administrador confirmado.');
      navigate('/dashboard/economia', { replace: true });
    },
    onError: (err: Error) => {
      limparCampos();
      toast.error(err.message ?? 'Código inválido.');
    },
  });

  const { mutate: confirmarSenha, isPending: confirmandoSenha } = useMutation({
    mutationFn: () => authService.confirmAdminPasswordChange({ code }),
    onSuccess: () => {
      // A troca carimba o instante que invalida todo token anterior — inclusive o
      // desta aba. Continuar no painel só adiaria um 401 confuso na próxima
      // requisição; melhor encerrar aqui e dizer por quê.
      clearSession();
      toast.success('Senha alterada. Entre novamente com a senha nova.');
      navigate('/login-usuario', { replace: true });
    },
    onError: (err: Error) => {
      limparCampos();
      toast.error(err.message ?? 'Código inválido.');
    },
  });

  const confirmando = confirmandoLogin || confirmandoSenha;

  function limparCampos() {
    setDigits(Array(DIGITS).fill(''));
    inputsRef.current[0]?.focus();
  }

  const confirmar = () => (modo === 'login' ? confirmarLogin() : confirmarSenha());

  // ── Handlers dos inputs ───────────────────────────────────────────────────

  const handleChange = (i: number, val: string) => {
    const digito = val.replace(/\D/g, '').slice(-1);
    const proximo = [...digits];
    proximo[i] = digito;
    setDigits(proximo);
    if (digito && i < DIGITS - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const colado = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGITS);
    if (!colado) return;
    const proximo = [...digits];
    colado.split('').forEach((d, i) => { proximo[i] = d; });
    setDigits(proximo);
    const primeiroVazio = proximo.findIndex((d) => !d);
    inputsRef.current[primeiroVazio !== -1 ? primeiroVazio : DIGITS - 1]?.focus();
  };

  return (
    <div className="app-shell flex bg-smoke-abyss">
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
            <h2 className="text-2xl font-bold text-white">
              {modo === 'login' ? 'Confirme o acesso' : 'Confirme a troca de senha'}
            </h2>
            <p className="text-slate-400 text-sm max-w-xs">
              {modo === 'login'
                ? 'Enviamos um código de 6 dígitos para o e-mail de segurança do administrador. Ele expira em 15 minutos.'
                : 'A senha atual continua valendo até você confirmar. O código foi enviado para o e-mail de segurança e expira em 15 minutos.'}
            </p>
          </div>

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
                disabled={confirmando}
                aria-label={`Dígito ${i + 1} de ${DIGITS}`}
                className="w-12 h-14 text-center text-xl font-bold rounded-lg
                           bg-slate-800 border border-slate-700 text-white
                           outline-none focus:border-amber-500 focus:ring-1
                           focus:ring-amber-500/30 transition-all disabled:opacity-50
                           caret-transparent"
              />
            ))}
          </div>

          <SubmitButton
            isPending={confirmando}
            label="Confirmar"
            pendingLabel="Confirmando…"
            disabled={!completo}
            onClick={confirmar}
          />

          <div className="flex flex-col items-center gap-2 text-sm">
            <p className="text-slate-500 text-xs text-center max-w-xs">
              Não pediu este código? Alguém acertou a senha de administrador —
              troque-a assim que possível.
            </p>
            <button
              type="button"
              onClick={() => {
                clearPendingAdminLogin();
                navigate('/login-usuario', { replace: true });
              }}
              className="text-slate-600 hover:text-slate-400 text-xs transition-colors cursor-pointer mt-1"
            >
              Cancelar e voltar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
