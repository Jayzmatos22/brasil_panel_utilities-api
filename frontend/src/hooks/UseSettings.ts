// src/hooks/UseSettings.ts
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authService } from '../api/services/Auth';
import type { UpdateNameRequest, UpdatePasswordRequest, DeleteAccountRequest } from '../types/UserType';

export function useUpdateName(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (data: UpdateNameRequest) => authService.updateName(data),
    onSuccess: () => {
      toast.success('Nome atualizado com sucesso!');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao atualizar nome.'),
  });
}

export function useUpdatePassword(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (data: UpdatePasswordRequest) => authService.updatePassword(data),
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao alterar senha.'),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (data: DeleteAccountRequest) => authService.deleteAccount(data),
    onSuccess: () => {
      toast.success('Conta deletada.');
      localStorage.removeItem('token');
      window.location.href = '/login-usuario';
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao deletar conta.'),
  });
}