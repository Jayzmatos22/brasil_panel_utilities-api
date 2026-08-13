// ─── Perfil profissional e acadêmico ─────────────────────────────────────────
//
// Espelha os DTOs do backend (com.brasilpanel.backend.dto.profile). A árvore
// área → subárea é compartilhada entre profissão e educação; só os níveis são
// separados.

// ── Catálogo — GET /api/profile/options ──
export interface SubareaOption {
  id: number;
  slug: string;
  name: string;
}

export interface AreaOption {
  id: number;
  slug: string;
  name: string;
  subareas: SubareaOption[];
}

export interface LevelOption {
  id: number;
  slug: string;
  name: string;
}

export interface ProfileOptions {
  areas: AreaOption[];
  educationLevels: LevelOption[];
  professionLevels: LevelOption[];
}

// ── Gravação — PUT /api/profile/me ──
// Ids nulos = campo não informado. O backend valida coerência (subárea pertencer
// à área, ids existirem).
export interface UpdateProfileRequest {
  professionAreaId: number | null;
  professionSubareaId: number | null;
  professionLevelId: number | null;
  professionTitle: string | null;
  educationAreaId: number | null;
  educationSubareaId: number | null;
  educationLevelId: number | null;
  institution: string | null;
}

// ── Leitura — GET /api/profile/me ──
export interface ProfileRef {
  id: number;
  slug: string;
  name: string;
}

export interface ProfileResponse {
  professionArea: ProfileRef | null;
  professionSubarea: ProfileRef | null;
  professionLevel: ProfileRef | null;
  professionTitle: string | null;
  educationArea: ProfileRef | null;
  educationSubarea: ProfileRef | null;
  educationLevel: ProfileRef | null;
  institution: string | null;
  updatedAt: string | null;
}
