import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase, Save } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Onboarding de perfil — profissão e formação.
 *
 * Substitui o antigo par endereço + dados bancários, que coletava CEP, conta e
 * cartão sem que nada disso existisse no Postgres (o cartão ia para o
 * localStorage em texto puro). O ViaCEP não sumiu: migrou para a página de
 * Estados e Municípios, onde os dados públicos de CEP fazem sentido.
 *
 * Estrutura pré-pronta: os campos abaixo são um ponto de partida, e o submit
 * ainda não persiste nada — falta o endpoint correspondente no backend.
 */

const ESCOLARIDADE = [
  'Ensino fundamental',
  'Ensino médio',
  'Ensino técnico',
  'Ensino superior — cursando',
  'Ensino superior — completo',
  'Pós-graduação',
  'Mestrado ou doutorado',
] as const;

const AREAS = [
  'Tecnologia',
  'Finanças',
  'Educação',
  'Saúde',
  'Indústria',
  'Comércio e serviços',
  'Setor público',
  'Outra',
] as const;

export default function PerfilPage() {
  const navigate = useNavigate();

  const [profissao, setProfissao] = useState('');
  const [area, setArea] = useState<string>('');
  const [escolaridade, setEscolaridade] = useState<string>('');
  const [instituicao, setInstituicao] = useState('');

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

    // TODO: enviar ao backend quando o endpoint de perfil existir.
    toast.success('Perfil salvo!');
    navigate('/dashboard/economia');
  };

  const inputClass =
    'w-full h-12 p-3 rounded-md bg-slate-800 text-white placeholder-slate-500 outline-none ' +
    'focus:ring-2 focus:ring-yellow-500 transition-all border border-slate-600';
  const labelClass = 'text-white text-sm ml-1';

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-gray-500 w-full max-w-2xl shadow-2xl flex flex-col p-card rounded-card bg-slate-900"
    >
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
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="area" className={labelClass}>
              Área de atuação
            </label>
            <select
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className={inputClass}
            >
              <option value="">Selecione</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
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
              onChange={(e) => setEscolaridade(e.target.value)}
              className={inputClass}
            >
              <option value="">Selecione</option>
              {ESCOLARIDADE.map((n) => (
                <option key={n} value={n}>
                  {n}
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
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8 border-t border-slate-700 pt-5">
        <button
          type="submit"
          className="flex-1 h-12 bg-green-600 hover:bg-green-700 cursor-pointer text-white font-bold
                     rounded-md transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
        >
          <Save size={18} />
          Salvar perfil
        </button>
        <button
          type="button"
          onClick={() => navigate('/dashboard/economia')}
          className="h-12 px-6 text-slate-400 hover:text-white cursor-pointer rounded-md
                     border border-slate-700 hover:border-slate-500 transition-all"
        >
          Pular por agora
        </button>
      </div>
    </form>
  );
}
