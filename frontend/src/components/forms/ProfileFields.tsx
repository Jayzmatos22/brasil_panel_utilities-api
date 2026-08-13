import { Briefcase, GraduationCap } from 'lucide-react';
import type { ProfileOptions, AreaOption, LevelOption } from '../../types/ProfileType';
import type { ProfileFormState } from '../../lib/profile/profileForm';

/**
 * Campos do perfil profissional e acadêmico — selects em cascata (Área →
 * Subárea → Nível) mais um texto livre em cada seção.
 *
 * Renderiza só os campos; quem usa (onboarding, configurações) fornece o
 * próprio <form> e botão de salvar. O estado é controlado por fora: `value`
 * segura tudo e `onChange` recebe um patch parcial.
 *
 * "Do todo para o específico": trocar a Área limpa a Subárea, já que a lista de
 * subáreas depende da área escolhida.
 */

interface ProfileFieldsProps {
  options: ProfileOptions;
  value: ProfileFormState;
  onChange: (patch: Partial<ProfileFormState>) => void;
  disabled?: boolean;
}

const controlClass = [
  'w-full h-12 px-4 rounded-lg bg-slate-800 text-white text-sm',
  'border border-slate-700 outline-none',
  'focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30',
  'transition-all disabled:opacity-50',
].join(' ');

const labelClass = 'text-slate-300 text-sm font-medium';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className={labelClass}>{label}</span>
      {children}
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  disabled,
  placeholder,
  items,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder: string;
  items: { id: number; name: string }[];
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={controlClass}
    >
      <option value="">{placeholder}</option>
      {items.map((it) => (
        <option key={it.id} value={String(it.id)}>
          {it.name}
        </option>
      ))}
    </select>
  );
}

function subareasFor(areas: AreaOption[], areaId: string) {
  if (!areaId) return [];
  return areas.find((a) => String(a.id) === areaId)?.subareas ?? [];
}

export function ProfileFields({ options, value, onChange, disabled }: ProfileFieldsProps) {
  const { areas } = options;
  const professionSubareas = subareasFor(areas, value.professionAreaId);
  const educationSubareas = subareasFor(areas, value.educationAreaId);

  const levelItems = (levels: LevelOption[]) => levels;

  return (
    <div className="grid-auto-cards gap-6 [--card-min:17rem]">
      {/* ── Profissão ── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
          <Briefcase size={18} />
          Profissão
        </h3>

        <Field label="Área de atuação">
          <Select
            id="prof-area"
            value={value.professionAreaId}
            disabled={disabled}
            placeholder="Selecione a área"
            items={areas}
            // Trocar a área invalida a subárea anterior.
            onChange={(v) => onChange({ professionAreaId: v, professionSubareaId: '' })}
          />
        </Field>

        <Field label="Subárea">
          <Select
            id="prof-subarea"
            value={value.professionSubareaId}
            disabled={disabled || !value.professionAreaId}
            placeholder={value.professionAreaId ? 'Selecione a subárea' : 'Escolha a área primeiro'}
            items={professionSubareas}
            onChange={(v) => onChange({ professionSubareaId: v })}
          />
        </Field>

        <Field label="Nível de senioridade">
          <Select
            id="prof-level"
            value={value.professionLevelId}
            disabled={disabled}
            placeholder="Selecione o nível"
            items={levelItems(options.professionLevels)}
            onChange={(v) => onChange({ professionLevelId: v })}
          />
        </Field>

        <Field label="Cargo / título (opcional)">
          <input
            id="prof-title"
            type="text"
            value={value.professionTitle}
            disabled={disabled}
            onChange={(e) => onChange({ professionTitle: e.target.value })}
            placeholder="Ex: Analista de dados"
            className={controlClass}
            maxLength={120}
          />
        </Field>
      </section>

      {/* ── Educação ── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
          <GraduationCap size={18} />
          Educação
        </h3>

        <Field label="Área de estudo">
          <Select
            id="edu-area"
            value={value.educationAreaId}
            disabled={disabled}
            placeholder="Selecione a área"
            items={areas}
            onChange={(v) => onChange({ educationAreaId: v, educationSubareaId: '' })}
          />
        </Field>

        <Field label="Subárea">
          <Select
            id="edu-subarea"
            value={value.educationSubareaId}
            disabled={disabled || !value.educationAreaId}
            placeholder={value.educationAreaId ? 'Selecione a subárea' : 'Escolha a área primeiro'}
            items={educationSubareas}
            onChange={(v) => onChange({ educationSubareaId: v })}
          />
        </Field>

        <Field label="Nível de formação">
          <Select
            id="edu-level"
            value={value.educationLevelId}
            disabled={disabled}
            placeholder="Selecione o nível"
            items={levelItems(options.educationLevels)}
            onChange={(v) => onChange({ educationLevelId: v })}
          />
        </Field>

        <Field label="Instituição (opcional)">
          <input
            id="edu-institution"
            type="text"
            value={value.institution}
            disabled={disabled}
            onChange={(e) => onChange({ institution: e.target.value })}
            placeholder="Ex: UFBA"
            className={controlClass}
            maxLength={120}
          />
        </Field>
      </section>
    </div>
  );
}
