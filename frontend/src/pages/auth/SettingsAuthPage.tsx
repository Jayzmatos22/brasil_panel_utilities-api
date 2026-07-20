import toast from "react-hot-toast";
import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  User,
  Trash2,
  ShieldAlert,
  KeyRound,
  AlertOctagon,
} from "lucide-react";
import { FormField } from "../../components/forms/FormField";
import { SubmitButton } from "../../components/forms/SubmitButton";
import { container, item } from "../../lib/motion/presets";
import {
  useUpdateName,
  useUpdatePassword,
  useDeleteAccount,
} from "../../hooks/UseSettings";

// ── Mapeamento de temas para escalabilidade ──────────────────────────
const themeMap = {
  green: {
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/[0.03]",
    topLine:
      "bg-linear-to-r from-emerald-500/50 via-green-400/30 to-transparent",
    iconBg: "bg-emerald-500/10 border border-emerald-500/20",
    iconColor: "text-emerald-400",
    titleColor: "text-emerald-50",
  },
  yellow: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/[0.03]",
    topLine:
      "bg-linear-to-r from-amber-500/50 via-yellow-400/30 to-transparent",
    iconBg: "bg-amber-500/10 border border-amber-500/20",
    iconColor: "text-amber-400",
    titleColor: "text-amber-50",
  },
  red: {
    border: "border-red-500/30",
    bg: "bg-red-500/[0.04]",
    topLine: "bg-linear-to-r from-red-600/60 via-red-400/30 to-transparent",
    iconBg: "bg-red-500/10 border border-red-500/20",
    iconColor: "text-red-400",
    titleColor: "text-red-50",
  },
};

function SettingsSection({
  icon,
  title,
  description,
  children,
  theme = "green",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  theme?: "green" | "yellow" | "red";
}) {
  const styles = themeMap[theme];

  return (
    <motion.section
      variants={item}
      className={`relative overflow-hidden rounded-2xl border ${styles.border} ${styles.bg} backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-6 flex flex-col gap-6 transition-colors duration-300`}
    >
      {/* Linha superior decorativa temática */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] ${styles.topLine}`}
      />

      <div className="flex items-center gap-4 pb-5 border-b border-slate-800/60">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconColor} shrink-0 transition-colors`}
        >
          {icon}
        </span>
        <div>
          <h2
            className={`font-semibold text-base tracking-tight ${styles.titleColor}`}
          >
            {title}
          </h2>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

export default function SettingsAuthPage() {
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const { mutate: changeName, isPending: pendingName } = useUpdateName(() =>
    setName(""),
  );
  const { mutate: changePassword, isPending: pendingPassword } =
    useUpdatePassword(() => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  const { mutate: deleteAccount, isPending: pendingDelete } =
    useDeleteAccount();

  const handleChangeName = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Digite o novo nome.");
      return;
    }
    if (name.trim().split(" ").length < 2) {
      toast.error("Digite nome e sobrenome.");
      return;
    }
    changeName({ name: name.trim() });
  };

  const handleChangePassword = (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Mínimo 8 caracteres.");
      return;
    }
    changePassword({ currentPassword, newPassword });
  };

  const handleDeleteAccount = (e: FormEvent) => {
    e.preventDefault();
    if (!deletePassword) {
      toast.error("Digite sua senha para confirmar.");
      return;
    }
    deleteAccount({ password: deletePassword });
  };

  // ── Dados do Menu de Navegação Rápida ──
  const quickNavItems = [
    {
      id: "section-profile",
      icon: <User size={16} />,
      label: "Perfil e Identidade",
      hoverBorder: "hover:border-emerald-500/40",
      hoverBg: "hover:bg-emerald-500/[0.05]",
      iconColor: "text-emerald-400",
    },
    {
      id: "section-security",
      icon: <KeyRound size={16} />,
      label: "Segurança e Acesso",
      hoverBorder: "hover:border-amber-500/40",
      hoverBg: "hover:bg-amber-500/[0.05]",
      iconColor: "text-amber-400",
    },
    {
      id: "section-danger",
      icon: <Trash2 size={16} />,
      label: "Zona de Perigo",
      hoverBorder: "hover:border-red-500/40",
      hoverBg: "hover:bg-red-500/[0.05]",
      iconColor: "text-red-400",
    },
  ];

  // Função para rolar suavemente até a seção
  const scrollToSection = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.div
      className="relative flex flex-col gap-8 max-w-3xl mx-auto w-full pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Efeito de brilho de fundo */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-slate-900/50 blur-3xl" />

      <motion.div variants={item} className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px flex-1 bg-linear-to-r from-slate-700 to-transparent" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            Preferências
          </span>
          <div className="h-px flex-1 bg-linear-to-l from-slate-700 to-transparent" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight bg-linear-to-b from-white to-slate-400 bg-clip-text text-transparent">
          Configurações da Conta
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Gerencie suas informações pessoais e a segurança da sua conta.
        </p>
      </motion.div>

      {/* ── Menu de Navegação Rápida (Sticky) ── */}
      <motion.nav
        variants={item}
        className="sticky top-4 z-20 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/70 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
      >
        {quickNavItems.map((navItem) => (
          <button
            key={navItem.id}
            onClick={() => scrollToSection(navItem.id)}
            className={`flex items-center gap-3 p-3 rounded-xl border border-transparent ${navItem.hoverBorder} ${navItem.hoverBg} transition-all duration-200 cursor-pointer group text-left`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 group-hover:bg-slate-700/50 ${navItem.iconColor} transition-colors shrink-0`}
            >
              {navItem.icon}
            </span>
            <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors truncate">
              {navItem.label}
            </span>
          </button>
        ))}
      </motion.nav>

      {/* ── Alterar nome ── */}
      <div id="section-profile" className="scroll-mt-28">
        <SettingsSection
          theme="green"
          icon={<User size={18} />}
          title="Perfil e Identidade"
          description="Atualize como seu nome é exibido no painel e relatórios."
        >
          <form onSubmit={handleChangeName} className="flex flex-col gap-5">
            <FormField
              id="settings-name"
              label="Novo nome completo"
              placeholder="Ex: João da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={pendingName}
              hint="Use nome e sobrenome para formalidades."
            />
            <div className="flex justify-end">
              <SubmitButton
                isPending={pendingName}
                label="Salvar nome"
                pendingLabel="Salvando…"
                className="bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300 px-8"
              />
            </div>
          </form>
        </SettingsSection>
      </div>

      {/* ── Alterar senha ── */}
      <div id="section-security" className="scroll-mt-28">
        <SettingsSection
          theme="yellow"
          icon={<KeyRound size={18} />}
          title="Segurança e Acesso"
          description="Mantenha sua conta protegida com uma senha forte e única."
        >
          <form onSubmit={handleChangePassword} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <FormField
                  id="settings-current-password"
                  label="Senha atual"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={pendingPassword}
                />
              </div>
              <FormField
                id="settings-new-password"
                label="Nova senha"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={pendingPassword}
                hint="Mínimo 8 caracteres."
              />
              <FormField
                id="settings-confirm-password"
                label="Confirmar nova senha"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={pendingPassword}
              />
            </div>
            <div className="flex justify-end">
              <SubmitButton
                isPending={pendingPassword}
                label="Alterar senha"
                pendingLabel="Alterando…"
                className="bg-linear-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-semibold shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all duration-300 px-8"
              />
            </div>
          </form>
        </SettingsSection>
      </div>

      {/* ── Zona de perigo ── */}
      <div id="section-danger" className="scroll-mt-28">
        <SettingsSection
          theme="red"
          icon={<AlertOctagon size={18} />}
          title="Zona de Perigo"
          description="Ações irreversíveis que afetam a existência da sua conta."
        >
          <form onSubmit={handleDeleteAccount} className="flex flex-col gap-5">
            <div className="flex items-start gap-4 bg-red-500/[0.07] border border-red-500/20 rounded-xl p-5">
              <ShieldAlert size={20} className="text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-red-300 text-sm font-medium leading-relaxed">
                  Atenção: A exclusão é permanente
                </p>
                <p className="text-red-300/70 text-xs leading-relaxed">
                  Ao deletar sua conta, todos os seus dados, histórico e acessos
                  serão permanentemente removidos dos nossos servidores. Esta
                  ação <strong>não pode ser desfeita</strong> e não há como
                  recuperar os dados posteriormente.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <FormField
                id="settings-delete-password"
                label="Confirme sua senha para prosseguir"
                type="password"
                placeholder="••••••••"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                disabled={pendingDelete}
              />

              <button
                type="submit"
                disabled={pendingDelete || !deletePassword}
                className="w-full h-12 bg-linear-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-bold
                           rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-30
                           disabled:cursor-not-allowed flex items-center justify-center gap-2.5
                           cursor-pointer text-sm shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] border border-red-500/20"
              >
                <Trash2 size={16} />
                {pendingDelete
                  ? "Deletando conta…"
                  : "Deletar permanentemente minha conta"}
              </button>
            </div>
          </form>
        </SettingsSection>
      </div>
    </motion.div>
  );
}
