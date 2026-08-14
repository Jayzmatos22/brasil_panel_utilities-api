import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Briefcase, Save, LoaderCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../api/services/Auth';
import type {
  EducationLevel,
  ProfessionalArea,
  ProfileResponse,
} from '../../types/UserType';

/**
 * Onboarding de perfil — profissão e formação.
 *
 * Até o PR do backend a tela era um esqueleto: o submit exibia "Perfil salvo!" e
 * navegava para o painel sem que nada saísse do estado do componente. Agora fala
 * com /api/auth/{profile,update-profile,skip-onboarding}, e o toast de sucesso só
 * aparece depois de o servidor confirmar.
 *
 * Serve também à edição posterior: entrar aqui com perfil já preenchido carrega
 * os valores e não remarca a data de conclusão do onboarding.
 */

const PROFILE_QUERY_KEY = ['auth', 'profile'] as const;

// Rótulo exibido e constante enviada. O backend valida contra um enum com CHECK
// no Postgres, então o `value` não pode divergir — acrescentar opção aqui sem a
// migration correspondente devolve 400.
const ESCOLARIDADE: ReadonlyArray<{ value: EducationLevel; label: string }> = [
  { value: 'ENSINO_FUNDAMENTAL',  label: 'Ensino fundamental' },
  { value: 'ENSINO_MEDIO',        label: 'Ensino médio' },
  { value: 'ENSINO_TECNICO',      label: 'Ensino técnico' },
  { value: 'SUPERIOR_CURSANDO',   label: 'Ensino superior — cursando' },
  { value: 'SUPERIOR_COMPLETO',   label: 'Ensino superior — completo' },
  { value: 'POS_GRADUACAO',       label: 'Pós-graduação' },
  { value: 'MESTRADO_DOUTORADO',  label: 'Mestrado ou doutorado' },
];

const AREAS: ReadonlyArray<{ value: ProfessionalArea; label: string }> = [
  { value: 'TECNOLOGIA',        label: 'Tecnologia' },
  { value: 'FINANCAS',          label: 'Finanças' },
  { value: 'EDUCACAO',          label: 'Educação' },
  { value: 'SAUDE',             label: 'Saúde' },
  { value: 'INDUSTRIA',         label: 'Indústria' },
  { value: 'COMERCIO_SERVICOS', label: 'Comércio e serviços' },
  { value: 'SETOR_PUBLICO',     label: 'Setor público' },
  { value: 'OUTRA',             label: 'Outra' },
];

const DESTINO = '/dashboard/economia';

const inputClass =
  'w-full h-12 p-3 rounded-md bg-slate-800 text-white placeholder-slate-500 outline-none ' +
  'focus:ring-2 focus:ring-yellow-500 transition-all border border-slate-600 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';
const labelClass = 'text-white text-sm ml-1';

const cardClass =
  'border border-gray-500 w-full max-w-2xl shadow-2xl flex flex-col p-card rounded-card bg-slate-900';

export default function PerfilPage() {
  // O perfil é carregado antes de montar o formulário para que os campos possam
  // nascer preenchidos, sem useEffect de sincronização.
  const { data, isPending } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: authService.getProfile,
    staleTime: Infinity,
    retry: false,
  });

  if (isPending) {
    return (
      <div className={`${cardClass} items-center justify-center min-h-64`}>
        <LoaderCircle size={32} className="text-yellow-500 animate-spin" />
      </div>
    );
  }

  // Falha aberta: se a consulta não voltou, a tela abre vazia em vez de travar.
  // O submit ainda funciona — quem valida de verdade é o servidor.
  return <PerfilForm inicial={data ?? null} />;
}


function PerfilForm({ inicial }: { inicial: ProfileResponse | null }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [profissao, setProfissao]       = useState(inicial?.profession ?? '');
  const [area, setArea]                 = useState<ProfessionalArea | ''>(inicial?.area ?? '');
  const [escolaridade, setEscolaridade] = useState<EducationLevel | ''>(inicial?.educationLevel ?? '');
  const [instituicao, setInstituicao]   = useState(inicial?.institution ?? '');

  // Já passou pelo onboarding: a saída secundária vira "cancelar", que só navega.
  // Chamar skip-onboarding de novo seria uma requisição sem efeito.
  const jaConcluido = inicial?.onboardingCompletedAt != null;

  const { mutate: salvar, isPending: salvando } = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (perfil) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, perfil);
      toast.success('Perfil salvo!');
      navigate(DESTINO, { replace: true });
    },
    onError: (err: Error) => toast.error(err.message ?? 'Não foi possível salvar o perfil.'),
  });

  const { mutate: pular, isPending: pulando } = useMutation({
    mutationFn: authService.skipOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      navigate(DESTINO, { replace: true });
    },
    // Pular não pode ficar preso por falha de rede: o destino é o painel de
    // qualquer forma, e a etapa volta a aparecer na próxima vez.
    onError: () => navigate(DESTINO, { replace: true }),
  });

  const ocupado = salvando || pulando;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!profissao.trim()) {
      toast.error('Informe sua profissão.');
      return;
    }
    if (!escolaridade) {
      toast.error('Selecione sua formação.');
      return;
    }

    salvar({
      profession:     profissao.trim(),
      area:           area || null,
      educationLevel: escolaridade,
      institution:    instituicao.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={cardClass}>
      <div className="flex items-center justify-center mb-8">
        <h2 className="text-white text-2xl flex items-center gap-3 tracking-wider border-b border-b-blue-300 pb-2">
          <Briefcase size={32} className="text-blue-400" />
          Perfil profissional
        </h2>
      </div>

      <p className="text-slate-400 text-sm mb-6 text-center">
        Usamos essas informações para destacar os indicadores mais relevantes
        para você. Você pode alterá-las depois nas configurações.
      </p>

      <div className="grid-auto-cards gap-5 [--card-min:16rem]">
        {/* ── Ocupação ── */}
        <div className="flex flex-col gap-4">
          <h3 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
            <Briefcase size={18} />
            Ocupação
          </h3>

          <div className="flex flex-col gap-2">
            <label htmlFor="profissao" className={labelClass}>
              Profissão
            </label>
            <input
              id="profissao"
              value={profissao}
              onChange={(e) => setProfissao(e.target.value)}
              placeholder="Ex: Analista de dados"
              maxLength={120}
              disabled={ocupado}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="area" className={labelClass}>
              Área de atuação <span className="text-slate-500">(opcional)</span>
            </label>
            <select
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value as ProfessionalArea | '')}
              disabled={ocupado}
              className={inputClass}
            >
              <option value="">Selecione</option>
              {AREAS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Formação ── */}
        <div className="flex flex-col gap-4">
          <h3 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
            <GraduationCap size={18} />
            Formação
          </h3>

          <div className="flex flex-col gap-2">
            <label htmlFor="escolaridade" className={labelClass}>
              Escolaridade
            </label>
            <select
              id="escolaridade"
              value={escolaridade}
              onChange={(e) => setEscolaridade(e.target.value as EducationLevel | '')}
              disabled={ocupado}
              className={inputClass}
            >
              <option value="">Selecione</option>
              {ESCOLARIDADE.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="instituicao" className={labelClass}>
              Instituição <span className="text-slate-500">(opcional)</span>
            </label>
            <input
              id="instituicao"
              value={instituicao}
              onChange={(e) => setInstituicao(e.target.value)}
              placeholder="Ex: UFBA"
              maxLength={160}
              disabled={ocupado}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8 border-t border-slate-700 pt-5">
        <button
          type="submit"
          disabled={ocupado}
          className="flex-1 h-12 bg-green-600 hover:bg-green-700 cursor-pointer text-white font-bold
                     rounded-md transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {salvando ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
          {salvando ? 'Salvando…' : 'Salvar perfil'}
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => (jaConcluido ? navigate(DESTINO) : pular())}
          className="h-12 px-6 text-slate-400 hover:text-white cursor-pointer rounded-md
                     border border-slate-700 hover:border-slate-500 transition-all
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {jaConcluido ? 'Cancelar' : 'Pular por agora'}
        </button>
      </div>
    </form>
  );
}
