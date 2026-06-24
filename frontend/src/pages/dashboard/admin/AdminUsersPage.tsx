// API: Backend próprio
// Endpoints consumidos:
//   GET /admin/users              → lista todos os usuários
//   PUT /admin/users/{id}/promote → promove para ADMIN
//   PUT /admin/users/{id}/demote  → rebaixa para USER

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { LoaderCircle, ShieldCheck, ShieldOff, Users, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../../api/client/Client';
import { getTokenEmail } from '../../../lib/auth/jwt';
import { container, item } from '../../../lib/motion/presets';
import type { UserRow } from '../../../types/UserType'


const fetchUsers = (): Promise<UserRow[]> =>
  apiClient.get<UserRow[]>('/admin/users').then((r) => r.data);

const promoteUser = (id: string) =>
  apiClient.put<UserRow>(`/admin/users/${id}/promote`).then((r) => r.data);

const demoteUser = (id: string) =>
  apiClient.put<UserRow>(`/admin/users/${id}/demote`).then((r) => r.data);

const ADMIN_VIDEO_GLOB = import.meta.glob('../../../assets/admin/admin-video.{mp4,webm,ogg,mov}', { 
  eager: true, 
  import: 'default' 
}) as Record<string, string>;
const adminVideoUrl = Object.values(ADMIN_VIDEO_GLOB)[0];

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

  const adminCount = users?.filter((u) => u.role === 'ADMIN').length ?? 0;
  const totalCount = users?.length ?? 0;

  return (
    <motion.div className="flex flex-col gap-6" variants={container} initial="hidden" animate="show">

      {/* ── Hero Section (Vídeo + Título + Cards) ── */}
      <motion.div 
        variants={item} 
        className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-slate-800/60"
      >
        {/* Vídeo de Fundo Rotacionado (Z-0) */}
        {adminVideoUrl && (
          <video
            src={adminVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                       h-full aspect-9-16 object-cover scale-[180%] -rotate-90 
                       opacity-40 pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Sombra base profunda (Z-10) */}
        <div
          className="absolute inset-0 z-10 bg-linear-to-r from-blue-950/60 via-transparent to-purple-950/50 pointer-events-none"
          aria-hidden="true"
        />

        {/* ── Energia Azul Elétrico (Esquerda - Z-15) ── */}
        <div className="absolute inset-y-0 left-0 w-[30%] z-15 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="glow-layer glow-core-left absolute left-0 inset-y-0 w-1 bg-linear-to-b from-transparent via-blue-400 to-transparent blur-[2px]" />
          <div className="glow-layer glow-bloom-left absolute left-0 inset-y-0 w-24 bg-linear-to-r from-blue-500/50 to-transparent blur-xl" />
          <div className="glow-layer glow-ambient-left absolute left-0 inset-y-0 w-full bg-linear-to-r from-blue-600/20 to-transparent blur-3xl" />
        </div>

        {/* ── Energia Violeta (Direita - Z-15) ── */}
        <div className="absolute inset-y-0 right-0 w-[30%] z-15 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="glow-layer glow-core-right absolute right-0 inset-y-0 w-1 bg-linear-to-b from-transparent via-violet-400 to-transparent blur-[2px]" />
          <div className="glow-layer glow-bloom-right absolute right-0 inset-y-0 w-24 bg-linear-to-l from-violet-500/50 to-transparent blur-xl" />
          <div className="glow-layer glow-ambient-right absolute right-0 inset-y-0 w-full bg-linear-to-l from-purple-600/20 to-transparent blur-3xl" />
        </div>

        {/* ── Ícones de Relâmpago (Z-25) ── */}
        {/* O size={64} substitui o font-size: 4rem do seu CSS para compatibilidade com SVG */}
        <Zap size={64} className="lightning-icon lightning-left" aria-hidden="true" />
        <Zap size={64} className="lightning-icon lightning-right" aria-hidden="true" />

        {/* Gradiente Topo/Base para legibilidade (Z-30) */}
        <div 
          className="absolute inset-0 z-30 bg-linear-to-b from-slate-950/80 via-slate-950/70 to-slate-950/95 pointer-events-none" 
          aria-hidden="true" 
        />

        {/* Brazil accent stripe (Z-40) */}
        <div className="absolute top-0 inset-x-0 h-0.5 z-40 bg-linear-to-r from-emerald-500 via-yellow-400 to-blue-700 pointer-events-none" aria-hidden="true" />

        {/* Conteúdo (Z-50) */}
        <div className="relative z-50 flex flex-col gap-6 p-6 sm:p-8">
          
          {/* Header */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400/15 backdrop-blur-sm border border-amber-400/20">
                <Users size={20} className="text-amber-400" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-lg">
                Gerenciamento de Usuários
              </h1>
            </div>
            <p className="text-sm text-slate-300 pl-13 drop-shadow-md">
              Gerencie permissões e funções de acesso dos membros da plataforma.
            </p>
          </div>

          {/* Stats row com Glassmorphism */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-700/40 bg-slate-950/60 backdrop-blur-md px-4 py-3.5 transition-all duration-200 hover:bg-slate-900/70">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total</p>
              <p className="mt-1 text-2xl font-bold text-white tabular-nums drop-shadow-sm">
                {isLoading ? '—' : totalCount}
              </p>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-950/30 backdrop-blur-md px-4 py-3.5 transition-all duration-200 hover:bg-amber-950/40">
              <p className="text-xs font-medium text-amber-400/80 uppercase tracking-wide">Admins</p>
              <p className="mt-1 text-2xl font-bold text-amber-400 tabular-nums drop-shadow-sm">
                {isLoading ? '—' : adminCount}
              </p>
            </div>
            <div className="hidden sm:block rounded-xl border border-emerald-400/20 bg-emerald-950/20 backdrop-blur-md px-4 py-3.5 transition-all duration-200 hover:bg-emerald-950/30">
              <p className="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Usuários</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400 tabular-nums drop-shadow-sm">
                {isLoading ? '—' : totalCount - adminCount}
              </p>
            </div>
          </div>

        </div>
      </motion.div>

      {/* ── Table card ── */}
      <motion.div
        variants={item}
        className="rounded-xl border border-slate-800 bg-slate-950/80 shadow-lg shadow-black/20 overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2.5 py-20 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin text-slate-500" />
            <span>Carregando usuários…</span>
          </div>
        ) : users && users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-slate-800/80">
                  <th scope="col" className="text-left py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Usuário</th>
                  <th scope="col" className="text-left py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Função</th>
                  <th scope="col" className="text-left py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Criado em</th>
                  <th scope="col" className="text-right py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const isMe = u.email === myEmail;
                  return (
                    <tr key={u.id} className="group hover:bg-slate-800/30 transition-colors duration-150">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold select-none ${u.role === 'ADMIN' ? 'bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/20' : 'bg-slate-800 text-slate-400 ring-1 ring-slate-700'}`} aria-hidden="true">
                            {u.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white truncate">{u.name}</span>
                              {isMe && (<span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">você</span>)}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md ${u.role === 'ADMIN' ? 'bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/15' : 'bg-slate-800/80 text-slate-400 ring-1 ring-slate-700/60'}`}>
                          {u.role === 'ADMIN' ? <ShieldCheck size={12} className="opacity-70" /> : <Users size={12} className="opacity-50" />}
                          {u.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs tabular-nums hidden md:table-cell">{formatDate(u.createdAt)}</td>
                      <td className="py-3.5 px-4 text-right">
                        {isMe ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600" title="Você não pode alterar sua própria função"><span className="w-1.5 h-1.5 rounded-full bg-slate-700" />Sem ação</span>
                        ) : u.role === 'USER' ? (
                          <button onClick={() => promote(u.id)} disabled={promoting || demoting} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-400/8 hover:bg-emerald-400/15 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150 cursor-pointer">
                            <ShieldCheck size={13} /><span className="hidden sm:inline">Promover</span>
                          </button>
                        ) : (
                          <button onClick={() => demote(u.id)} disabled={promoting || demoting} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-400/8 hover:bg-rose-400/15 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150 cursor-pointer">
                            <ShieldOff size={13} /><span className="hidden sm:inline">Revogar</span>
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
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/60"><Users size={20} className="text-slate-600" /></div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-400">Nenhum usuário encontrado</p>
              <p className="mt-0.5 text-xs text-slate-600">Novos membros aparecerão aqui assim que se cadastrarem.</p>
            </div>
          </div>
        )}
      </motion.div>

    </motion.div>
  );
}