interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  autoComplete?: string;
  hint?: string;
}

const inputClass = [
  'w-full h-12 px-4 rounded-lg bg-slate-800 text-white text-sm',
  'placeholder-slate-500 border border-slate-700',
  'outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30',
  'transition-all disabled:opacity-50',
].join(' ');

export function FormField({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled,
  autoComplete,
  hint,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-slate-300 text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={inputClass}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {hint && (
        <p className="text-slate-600 text-xs ml-0.5">{hint}</p>
      )}
    </div>
  );
}
