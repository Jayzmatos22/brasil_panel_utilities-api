// API: Backend próprio
// Endpoints consumidos:
//   GET /admin/users              → lista todos os usuários
//   PUT /admin/users/{id}/promote → promove para ADMIN
//   PUT /admin/users/{id}/demote  → rebaixa para USER

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { LoaderCircle, ShieldCheck, ShieldOff, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../../api/client/Client';
import { getTokenEmail } from '../../../lib/auth/jwt';
import { container, item } from '../../../lib/motion/presets';

interface UserRow {
  id:        string;
  name:      string;
  email:     string;
  role:      'USER' | 'ADMIN';
  createdAt: string;
}

const fetchUsers = (): Promise<UserRow[]> =>
  apiClient.get<UserRow[]>('/admin/users').then((r) => r.data);

const promoteUser = (id: string) =>
  apiClient.put<UserRow>(`/admin/users/${id}/promote`).then((r) => r.data);

const demoteUser = (id: string) =>
  apiClient.put<UserRow>(`/admin/users/${id}/demote`).then((r) => r.data);

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const myEmail = getTokenEmail();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn:  fetchUsers,
  });

  const { mutate: promote, isPending: promoting } = useMutation({
    mutationFn: promoteUser,
    onSuccess: () => {
      toast.success('Usuário promovido a Admin.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: demote, isPending: demoting } = useMutation({
    mutationFn: demoteUser,
    onSuccess: () => {
      toast.success('Admin rebaixado para Usuário.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <motion.div className="flex flex-col gap-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex items-center gap-3">
        <Users size={22} className="text-amber-400" />
        <h1 className="text-2xl font-bold text-amber-400">Gerenciamento de Usuários</h1>
      </motion.div>

      <motion.div
        variants={item}
        className="bg-slate-900 border border-slate-700 rounded-xl p-5"
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando usuários...
          </div>
        ) : users && users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Nome</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">E-mail</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Role</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Criado em</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isMe = u.email === myEmail;
                  return (
                    <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 text-white font-medium">
                        {u.name}
                        {isMe && (
                          <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-400
                                           px-1.5 py-0.5 rounded font-semibold">você</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{u.email}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{formatDate(u.createdAt)}</td>
                      <td className="py-2.5 px-3 text-right">
                        {/* Não permite alterar o próprio role */}
                        {isMe ? (
                          <span className="text-slate-600 text-xs">—</span>
                        ) : u.role === 'USER' ? (
                          <button
                            onClick={() => promote(u.id)}
                            disabled={promoting || demoting}
                            className="flex items-center gap-1.5 ml-auto text-xs text-green-400
                                       hover:text-green-300 disabled:opacity-40 transition-colors cursor-pointer"
                          >
                            <ShieldCheck size={13} />
                            Promover
                          </button>
                        ) : (
                          <button
                            onClick={() => demote(u.id)}
                            disabled={promoting || demoting}
                            className="flex items-center gap-1.5 ml-auto text-xs text-red-400
                                       hover:text-red-300 disabled:opacity-40 transition-colors cursor-pointer"
                          >
                            <ShieldOff size={13} />
                            Revogar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Nenhum usuário cadastrado.</p>
        )}
      </motion.div>
    </motion.div>
  );
}