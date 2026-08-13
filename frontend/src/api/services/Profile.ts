import { apiClient } from '../client/Client';
import type {
  ProfileOptions,
  ProfileResponse,
  UpdateProfileRequest,
} from '../../types/ProfileType';

export const profileService = {
  // Catálogo estático (áreas, subáreas, níveis) — montado uma vez e cacheado.
  getOptions: () =>
    apiClient.get<ProfileOptions>('/profile/options').then((r) => r.data),

  getMe: () =>
    apiClient.get<ProfileResponse>('/profile/me').then((r) => r.data),

  update: (data: UpdateProfileRequest) =>
    apiClient.put<ProfileResponse>('/profile/me', data).then((r) => r.data),
};
