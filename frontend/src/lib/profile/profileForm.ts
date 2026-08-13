import type { ProfileResponse, UpdateProfileRequest } from '../../types/ProfileType';

/**
 * Estado do formulário de perfil, compartilhado pelo onboarding e pelas
 * configurações. Tudo string porque `<select>`/`<input>` trabalham com string;
 * a conversão para número/null acontece só no envio.
 */
export interface ProfileFormState {
  professionAreaId: string;
  professionSubareaId: string;
  professionLevelId: string;
  professionTitle: string;
  educationAreaId: string;
  educationSubareaId: string;
  educationLevelId: string;
  institution: string;
}

export const EMPTY_PROFILE_FORM: ProfileFormState = {
  professionAreaId: '',
  professionSubareaId: '',
  professionLevelId: '',
  professionTitle: '',
  educationAreaId: '',
  educationSubareaId: '',
  educationLevelId: '',
  institution: '',
};

/** Perfil vindo do backend → estado do formulário. */
export function profileToForm(p: ProfileResponse): ProfileFormState {
  const id = (ref: { id: number } | null) => (ref ? String(ref.id) : '');
  return {
    professionAreaId: id(p.professionArea),
    professionSubareaId: id(p.professionSubarea),
    professionLevelId: id(p.professionLevel),
    professionTitle: p.professionTitle ?? '',
    educationAreaId: id(p.educationArea),
    educationSubareaId: id(p.educationSubarea),
    educationLevelId: id(p.educationLevel),
    institution: p.institution ?? '',
  };
}

/** Estado do formulário → payload do PUT. Vazio vira null. */
export function formToRequest(f: ProfileFormState): UpdateProfileRequest {
  const num = (s: string) => (s ? Number(s) : null);
  const str = (s: string) => (s.trim() ? s.trim() : null);
  return {
    professionAreaId: num(f.professionAreaId),
    professionSubareaId: num(f.professionSubareaId),
    professionLevelId: num(f.professionLevelId),
    professionTitle: str(f.professionTitle),
    educationAreaId: num(f.educationAreaId),
    educationSubareaId: num(f.educationSubareaId),
    educationLevelId: num(f.educationLevelId),
    institution: str(f.institution),
  };
}
