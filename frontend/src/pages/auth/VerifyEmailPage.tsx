import { useEffect, useRef, useState, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LoaderCircle, MailCheck, RefreshCw, ShieldAlert } from 'lucide-react';
import { authService } from '../../api/services/Auth';
import type { AuthResponse } from '../../types/UserType';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { AuthBrandPanel } from '../../components/forms/AuthBrandPanel';
import { SubmitButton } from '../../components/forms/SubmitButton';
import { saveSession } from '../../lib/auth/jwt';

const DIGITS = 6;

export default function VerifyEmailPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  // E-mail passado via navigate state pelo RegisterPage
  const email: string = location.state?.email ?? '';

  const [digits, setDigits] = useState<string[]>(Array(DIGITS).fill(''));
  const [cooldown, setCooldown] = useState(0);   // segundos até poder reenviar
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown regressivo
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Se não tiver e-mail (acesso direto à rota), volta para registro
  useEffect(() => {
    if (!email) navigate('/registro-usuario', { replace: true });
  }, [email, navigate]);

  // ── Mutações ──────────────────────────────────────────────────────────────

  const { mutate: verify, isPending: verifying } = useMutation({
    mutationFn: () => authService.verifyEmail({ email, code: digits.join('') }),
    onSuccess: (res: AuthResponse) => {
      // O JWT já veio em cookie httpOnly; aqui guardamos só o hint de exibição.
      saveSession(res.email, res.role, res.expiresInMs);
      toast.success('E-mail verificado! Bem-vindo ao Brasil Panel.');
      // Novo usuário verificado vai ao onboarding de perfil (profissão e
      // formação). É pulável — a própria PerfilPage segue para o painel.
      navigate('/dados-perfil', { replace: true });
    },
    onError: (err: Error) => toast.error(err.message ?? 'Código inválido.'),
  });

  const { mutate: resend, isPending: resending } = useMutation({
    mutationFn: () => authService.resendCode({ email }),
    onSuccess: () => {
      toast.success('Novo código enviado!');
      setDigits(Array(DIGITS).fill(''));
      inputsRef.current[0]?.focus();
      setCooldown(60);  // 60s de cooldown entre reenvios
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao reenviar.'),
  });

  // ── Handlers dos inputs ───────────────────────────────────────────────────

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    if (digit && i < DIGITS - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGITS);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setDigits(next);
    // Foca o próximo campo vazio
    const nextEmpty = next.findIndex((d) => !d);
    inputsRef.current[nextEmpty !== -1 ? nextEmpty : DIGITS - 1]?.focus();
  };

  const code = digits.join('');
  const isComplete = code.length === DIGITS;

  return (
    <div className="min-h-screen flex bg-slate-950">
      <AuthBrandPanel />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Logo mobile */}
          <div className="flex justify-center lg:hidden">
            <BrandLogo variant="sidebar" />
          </div>

          {/* Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
              <MailCheck size={28} className="text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Verifique seu e-mail</h2>
            <p className="text-slate-400 text-sm max-w-xs">
              Enviamos um código de 6 dígitos para{' '}
              <span className="text-white font-medium">{email}</span>.
              Ele expira em 15 minutos.
            </p>

            {/* O aviso é permanente, e não um estado de erro que aparece depois
                de o usuário esperar: o remetente ainda é uma conta comum, sem
                domínio verificado, e o Gmail vem classificando a mensagem como
                spam. Quem não souber olhar lá fica travado numa tela de seis
                campos vazios sem entender por quê. Some quando a entrega deixar
                de depender disso. */}
            <p className="flex items-start gap-2 text-xs text-amber-300/90 bg-amber-500/10
                          border border-amber-500/20 rounded-lg px-3 py-2 max-w-xs text-left">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>
                Não encontrou? Confira a caixa de <strong className="font-semibold">spam</strong>{' '}
                ou lixo eletrônico — e marque como "não é spam" para os próximos chegarem.
              </span>
            </p>
          </div>

          {/* Inputs dos dígitos */}
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
                disabled={verifying}
                className="w-12 h-14 text-center text-xl font-bold rounded-lg
                           bg-slate-800 border border-slate-700 text-white
                           outline-none focus:border-amber-500 focus:ring-1
                           focus:ring-amber-500/30 transition-all disabled:opacity-50
                           caret-transparent"
              />
            ))}
          </div>

          {/* Botão verificar */}
          <SubmitButton
            isPending={verifying}
            label="Verificar e-mail"
            pendingLabel="Verificando…"
            disabled={!isComplete}
            onClick={() => verify()}
          />

          {/* Reenviar */}
          <div className="flex flex-col items-center gap-2 text-sm">
            <span className="text-slate-500">Não recebeu o código?</span>
            {cooldown > 0 ? (
              <span className="text-slate-600 text-xs">
                Reenviar em {cooldown}s…
              </span>
            ) : (
              <button
                type="button"
                onClick={() => resend()}
                disabled={resending}
                className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300
                           font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {resending
                  ? <><LoaderCircle size={13} className="animate-spin" /> Enviando…</>
                  : <><RefreshCw size={13} /> Reenviar código</>
                }
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/login-usuario')}
              className="text-slate-600 hover:text-slate-400 text-xs transition-colors cursor-pointer mt-1"
            >
              Já tenho conta — fazer login
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}