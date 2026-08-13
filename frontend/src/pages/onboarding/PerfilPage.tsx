import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Save, LoaderCircle } from 'lucide-react';

import { ProfileFields } from '../../components/forms/ProfileFields';
import { useProfileOptions, useUpdateProfile } from '../../hooks/UseProfile';
import {
  EMPTY_PROFILE_FORM,
  formToRequest,
  type ProfileFormState,
} from '../../lib/profile/profileForm';

/**
 * Onboarding de perfil — profissão e formação.
 *
 * Substitui o antigo par endereço + dados bancários, que coletava CEP, conta e
 * cartão sem que nada disso existisse no Postgres. Agora persiste de verdade em
 * `user_profiles` via PUT /api/profile/me. O usuário pode pular e completar
 * depois nas configurações — nenhum campo é obrigatório.
 */

const DESTINO = '/dashboard/economia';

export default function PerfilPage() {
  const navigate = useNavigate();

  const { data: options, isLoading, isError } = useProfileOptions();
  const [form, setForm] = useState<ProfileFormState>(EMPTY_PROFILE_FORM);

  const { mutate: save, isPending } = useUpdateProfile(() =>
    navigate(DESTINO, { replace: true }),
  );

  const patch = (p: Partial<ProfileFormState>) =>
    setForm((prev) => ({ ...prev, ...p }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save(formToRequest(form));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-gray-500 w-full max-w-3xl shadow-2xl flex flex-col p-card rounded-card bg-slate-900"
    >
      <div className="flex items-center justify-center mb-6">
        <h2 className="text-white text-2xl flex items-center gap-3 tracking-wider border-b border-b-blue-300 pb-2">
          <Briefcase size={32} className="text-blue-400" />
          Perfil profissional
        </h2>
      </div>

      <p className="text-slate-400 text-sm mb-8 text-center">
        Usamos essas informações para destacar os indicadores mais relevantes
        para você. Você pode alterá-las depois nas configurações.
      </p>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-slate-400 py-12">
          <LoaderCircle size={18} className="animate-spin" />
          Carregando opções…
        </div>
      )}

      {isError && (
        <div className="text-center py-12 text-slate-400">
          <p className="mb-4">Não foi possível carregar as opções agora.</p>
          <button
            type="button"
            onClick={() => navigate(DESTINO, { replace: true })}
            className="h-11 px-6 rounded-md border border-slate-700 hover:border-slate-500 text-slate-300 transition-all cursor-pointer"
          >
            Continuar para o painel
          </button>
        </div>
      )}

      {options && (
        <>
          <ProfileFields
            options={options}
            value={form}
            onChange={patch}
            disabled={isPending}
          />

          <div className="flex flex-col sm:flex-row gap-3 mt-8 border-t border-slate-700 pt-5">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-12 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
                         cursor-pointer text-white font-bold rounded-md transition-all shadow-lg active:scale-95
                         flex items-center justify-center gap-2"
            >
              {isPending ? (
                <><LoaderCircle size={18} className="animate-spin" />Salvando…</>
              ) : (
                <><Save size={18} />Salvar perfil</>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(DESTINO, { replace: true })}
              disabled={isPending}
              className="h-12 px-6 text-slate-400 hover:text-white cursor-pointer rounded-md
                         border border-slate-700 hover:border-slate-500 transition-all disabled:opacity-50"
            >
              Pular por agora
            </button>
          </div>
        </>
      )}
    </form>
  );
}
