import { useState, useEffect, type FormEvent } from 'react';
import { getCryptoPrice } from '../api/ApiCripto';
import type { CryptoData } from '../types/CriptoType';
import { Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Bitcoin } from 'lucide-react';

export default function CriptosInterface() {
  const [crypto, setCrypto] = useState<CryptoData | null>(null);
  const [search, setSearch] = useState('bitcoin');
  const [loading, setLoading] = useState(true);

  const fetchCrypto = async (coin: string) => {
    setLoading(true);
    try {
      const data = await getCryptoPrice(coin.toLowerCase().trim());
      setCrypto(data);
    } catch (err) {
      setCrypto(null);
      toast.error(err instanceof Error ? err.message : 'Moeda não encontrada');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrypto('bitcoin');
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!search.trim()) {
      toast.error('Digite o nome da moeda');
      return;
    }
    fetchCrypto(search);
  };

  return (
    <div className="bg-slate-800 w-full max-w-2xl p-6 rounded-xl border border-slate-600 flex flex-col gap-5">
      
      {/* Busca */}
      <form onSubmit={handleSearch} className="flex flex-col justify-center gap-2">
        <h1 className= "flex justify-center items-center gap-2 text-white font-bold text-xl">
            <Bitcoin size={28} className="text-yellow-500 bitcoin-iccon" />
            <span className="text-yellow-500 font-bold text-lg">Buscar cotação de criptomoeda</span>
        </h1>
        <input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-12 p-3 rounded-md bg-slate-950 text-white placeholder:text-slate-500 
                     border border-slate-600 outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
          placeholder="bitcoin, ethereum, solana..."
        />
        <button type="submit"
          className="bg-yellow-500 hover:bg-yellow-800 text-white font-bold px-5 rounded-md 
                     transition-all max-h-10 h-10 cursor-pointer flex items-center gap-2">
          <Search size={18} />
          Buscar
        </button>
      </form>

      {/* Resultado */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={32} className="text-yellow-500 animate-spin" />
        </div>
      ) : crypto ? (
        <div className="flex flex-col gap-2">
          <p className="text-white text-sm capitalize">{crypto.name}</p>
          <p className="text-white text-4xl font-mono cripto-brl rounded-md font-bold">{crypto.formattedPrice}</p>
          <p className="text-white text-xs ">Moeda: {crypto.currency}</p>
        </div>
      ) : (
        <p className="text-slate-400 text-center py-10">Nenhuma moeda encontrada</p>
      )}
    </div>
  );
}