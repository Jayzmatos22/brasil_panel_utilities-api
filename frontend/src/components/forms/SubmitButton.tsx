import { LoaderCircle } from 'lucide-react';

interface SubmitButtonProps {
  isPending: boolean;
  label: string;
  pendingLabel?: string;
  disabled?: boolean;
  onClick?: () => void;   // permite uso como botão comum (fora de <form>)
  className?: string;
}

export function SubmitButton({
  isPending,
  label,
  pendingLabel = 'Aguarde…',
  disabled,
  onClick,
  className = ''
}: SubmitButtonProps) {
  return (
    <button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={isPending || disabled}
      className={`w-full h-12 mt-1 text-slate-950 font-bold rounded-lg transition-all
                 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                 flex items-center justify-center gap-2 cursor-pointer text-sm
                 bg-amber-500 hover:bg-amber-400 ${className}`} // ← className no final pra sobrescrever
    >
      {isPending
        ? <><LoaderCircle size={15} className="animate-spin" />{pendingLabel}</>
        : label
      }
    </button>
  );
}