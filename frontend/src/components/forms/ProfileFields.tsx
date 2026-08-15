import { Briefcase, GraduationCap } from 'lucide-react';
import type { ProfileOptions, AreaOption, LevelOption } from '../../types/ProfileType';
import type { ProfileFormState } from '../../lib/profile/profileForm';
import { SelectField } from './SelectField';

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
 *
 * Os selects são `SelectField`, e não `<select>` nativo: o `<option>` é
 * desenhado pelo user agent, então no mobile a lista abria mais larga que o
 * card e com o azul/branco do sistema. O motivo completo está no cabeçalho de
 * SelectField.tsx.
 */

interface ProfileFieldsProps {
  options: ProfileOptions;
  value: ProfileFormState;
  onChange: (patch: Partial<ProfileFormState>) => void;
  disabled?: boolean;
}

const controlClass = [
  'w-full h-12 px-4 rounded-control bg-slate-800 text-white text-sm',
  // placeholder-slate-400 e não -500: sobre bg-slate-800 o 500 dá 2,7:1 e
  // reprova o AA para texto normal; o 400 dá 4,9:1.
  'placeholder-slate-400 border border-slate-700 outline-none',
  'focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30',
  'transition-all disabled:opacity-50',
].join(' ');

/**
 * Rótulo + campo de texto. Os selects trazem o próprio rótulo, porque o vínculo
 * deles é por `aria-labelledby` e não por `for` — `for` não alcança um <button>.
 */
function Field({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-slate-300 text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
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
          <Briefcase size={18} aria-hidden="true" />
          Profissão
        </h3>

        <SelectField
          id="prof-area"
          label="Área de atuação"
          value={value.professionAreaId}
          disabled={disabled}
          placeholder="Selecione a área"
          options={areas}
          // Trocar a área invalida a subárea anterior.
          onChange={(v) => onChange({ professionAreaId: v, professionSubareaId: '' })}
        />

        <SelectField
          id="prof-subarea"
          label="Subárea"
          value={value.professionSubareaId}
          disabled={disabled || !value.professionAreaId}
          placeholder={value.professionAreaId ? 'Selecione a subárea' : 'Escolha a área primeiro'}
          options={professionSubareas}
          onChange={(v) => onChange({ professionSubareaId: v })}
        />

        <SelectField
          id="prof-level"
          label="Nível de senioridade"
          value={value.professionLevelId}
          disabled={disabled}
          placeholder="Selecione o nível"
          options={levelItems(options.professionLevels)}
          onChange={(v) => onChange({ professionLevelId: v })}
        />

        <Field htmlFor="prof-title" label="Cargo / título (opcional)">
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
          <GraduationCap size={18} aria-hidden="true" />
          Educação
        </h3>

        <SelectField
          id="edu-area"
          label="Área de estudo"
          value={value.educationAreaId}
          disabled={disabled}
          placeholder="Selecione a área"
          options={areas}
          onChange={(v) => onChange({ educationAreaId: v, educationSubareaId: '' })}
        />

        <SelectField
          id="edu-subarea"
          label="Subárea"
          value={value.educationSubareaId}
          disabled={disabled || !value.educationAreaId}
          placeholder={value.educationAreaId ? 'Selecione a subárea' : 'Escolha a área primeiro'}
          options={educationSubareas}
          onChange={(v) => onChange({ educationSubareaId: v })}
        />

        <SelectField
          id="edu-level"
          label="Nível de formação"
          value={value.educationLevelId}
          disabled={disabled}
          placeholder="Selecione o nível"
          options={levelItems(options.educationLevels)}
          onChange={(v) => onChange({ educationLevelId: v })}
        />

        <Field htmlFor="edu-institution" label="Instituição (opcional)">
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
