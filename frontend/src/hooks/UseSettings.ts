// src/hooks/UseSettings.ts
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/services/Auth';
import { clearSession, updateSessionName } from '../lib/auth/jwt';
import type { UpdateNameRequest, UpdatePasswordRequest, DeleteAccountRequest } from '../types/UserType';

export function useUpdateName(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (data: UpdateNameRequest) => authService.updateName(data),
    // O hint da sessão passou a guardar o nome, porque é dele que o cabeçalho
    // do painel vive. Sem sincronizar aqui, o cabeçalho exibiria o nome antigo
    // até o próximo login — o toast diria "atualizado com sucesso" e a tela ao
    // lado desmentiria.
    onSuccess: (_res, variables) => {
      updateSessionName(variables.name);
      toast.success('Nome atualizado com sucesso!');
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao atualizar nome.'),
  });
}

export function useUpdatePassword(onSuccess?: () => void) {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: UpdatePasswordRequest) => authService.updatePassword(data),
    onSuccess: (res) => {
      // Admin: a senha nova ficou retida no desafio e a atual continua valendo.
      // Anunciar "alterada com sucesso" aqui seria mentira — e mentira perigosa,
      // porque a pessoa sairia achando que a senha antiga não abre mais nada.
      if (res.pending) {
        toast.success('Confirme o código enviado ao e-mail de segurança.');
        navigate('/confirmar-admin/senha');
        return;
      }
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
      clearSession();
      window.location.href = '/login-usuario';
    },
    onError: (err: Error) => toast.error(err.message ?? 'Erro ao deletar conta.'),
  });
}