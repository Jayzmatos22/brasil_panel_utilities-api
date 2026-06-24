import { motion } from 'motion/react';
import { container, item } from '../../../lib/motion/presets'; // Ajuste o path se necessário

export default function ImpostosPage() {
  return (
    <motion.div 
      className="flex flex-col gap-6" 
      variants={container} 
      initial="hidden" 
      animate="show"
    >
      <motion.header variants={item}>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
          Carga <span className="text-[#FFDF00]">Tributária</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xl">
          Página em construção. Teste de rota e renderização.
        </p>
      </motion.header>

      <motion.div variants={item} className="p-8 border border-dashed border-slate-700 rounded-2xl bg-slate-900/30 flex items-center justify-center">
        <span className="text-slate-500 font-mono">Div de teste — Impostos renderizando com sucesso!</span>
      </motion.div>
    </motion.div>
  );
}