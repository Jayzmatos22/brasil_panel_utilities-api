// API: BrasilAPI
// Endpoints consumidos:
//   GET /banks        → useAllBanks()
//   GET /banks/{code} → useBankByCode(code)

import { useState, type ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { LoaderCircle, Search } from 'lucide-react';
import { useAllBanks, useBankByCode } from '../../../hooks/UseBanks';
import { container, item } from '../../../lib/motion/presets';

export default function BancosPage() {
  const [search,  setSearch]  = useState('');
  const [code,    setCode]    = useState(0);
  const [codeInput, setCodeInput] = useState('');

  const { data: banks,   isLoading: loadingAll  } = useAllBanks();
  const { data: byCode,  isLoading: loadingCode } = useBankByCode(code);

  const filtered = banks?.filter(b =>
    b.name && b.code && (
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      String(b.code).includes(search)
    )
  ) ?? [];

  const handleCodeSearch = (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = parseInt(codeInput, 10);
    if (!isNaN(parsed) && parsed > 0) setCode(parsed);
  };

  return (
    <motion.div className="flex flex-col gap-6" variants={container} initial="hidden" animate="show">
      <motion.h1 variants={item} className="text-2xl font-bold text-white">Bancos do Brasil</motion.h1>

      {/* Busca por código */}
      <motion.div variants={item} whileHover={{ y: -4 }} className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-md flex flex-col gap-3">
        <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider">Busca por Código</h2>
        <form onSubmit={handleCodeSearch} className="flex gap-2">
          <input
            type="number"
            value={codeInput}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCodeInput(e.target.value)}
            placeholder="Ex: 341"
            className="flex-1 h-10 px-3 rounded-md bg-slate-800 text-white border border-slate-600
                       placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm"
          />
          <button
            type="submit"
            className="h-10 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md
                       flex items-center gap-2 font-semibold text-sm transition-all active:scale-95"
          >
            <Search size={15} />
            Buscar
          </button>
        </form>

        {loadingCode && code > 0 && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={14} className="animate-spin" /> Buscando...
          </div>
        )}

        {byCode && (
          <div className="bg-slate-800 rounded-lg px-4 py-3 flex flex-col gap-1">
            <p className="text-white font-bold">{byCode.name}</p>
            <p className="text-slate-400 text-sm">{byCode.fullName}</p>
            <div className="flex gap-4 mt-1 text-xs text-slate-500">
              <span>Código: <span className="text-yellow-400">{byCode.code}</span></span>
              <span>ISPB: <span className="text-slate-300">{byCode.ispb}</span></span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Lista completa com filtro */}
      <motion.div variants={item} whileHover={{ y: -4 }} className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider">
            Todos os Bancos {banks && `(${filtered.length})`}
          </h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Filtrar por nome ou código..."
              className="h-9 pl-9 pr-3 rounded-md bg-slate-800 text-white border border-slate-600
                         placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm w-64"
            />
          </div>
        </div>

        {loadingAll ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando bancos...
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium w-20">Código</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Nome</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium hidden md:table-cell">ISPB</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(bank => (
                  <tr key={bank.ispb} className="border-b border-slate-800 hover:bg-slate-800 transition-colors">
                    <td className="py-2 px-3 text-yellow-400 font-mono">{bank.code}</td>
                    <td className="py-2 px-3 text-white">{bank.name}</td>
                    <td className="py-2 px-3 text-slate-500 font-mono text-xs hidden md:table-cell">{bank.ispb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">Nenhum banco encontrado.</p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}