import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { profileService } from '../api/services/Profile';
import type { UpdateProfileRequest } from '../types/ProfileType';

/**
 * Catálogo de opções do perfil. É dado de referência estático: `staleTime:
 * Infinity` evita recarregá-lo a cada montagem (onboarding + configurações).
 */
export function useProfileOptions() {
  return useQuery({
    queryKey: ['profile', 'options'],
    queryFn: profileService.getOptions,
    staleTime: Infinity,
  });
}

/** Perfil do usuário autenticado. */
export function useProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileService.getMe,
  });
}

export function useUpdateProfile(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      toast.success('Perfil salvo!');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao salvar perfil.'),
  });
}
