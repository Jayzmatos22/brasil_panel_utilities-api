import { useState, useEffect, type FormEvent } from "react";
import { BadgeJapaneseYen } from "lucide-react";
import toast from "react-hot-toast";
import { type CurrencyCode, getExchangeRate } from "../api/ExchangeRateApi";
import type { ExchangeData } from "../types/ExchangeDataType";
import { CURRENCIES } from "../api/ExchangeRateApi";

export default function ExchangeInterface() {
  const [exchange, setExchange] = useState<ExchangeData | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>("USD");
  const [targetCurrency, setTargetCurrency] = useState<CurrencyCode>("BRL");
  const [loading, setLoading] = useState<boolean>(false);

  // Função para buscar a taxa de câmbio
  const fetchExchangeRate = async (
    base: CurrencyCode,
    target: CurrencyCode,
  ) => {
    setLoading(true);
    try {
      const data = await getExchangeRate(base, target);
      setExchange(data);
    } catch (err) {
      setExchange(null);
      toast.error(
        err instanceof Error ? err.message : "Erro ao buscar taxa de câmbio",
      );
    } finally {
        if (loading){
            toast.success("Taxa de câmbio atualizada");
            setLoading(false);
        }
    }
  };

  useEffect(() => {
    fetchExchangeRate(baseCurrency, targetCurrency);
  }, [baseCurrency, targetCurrency]);

  const searchExchangeRate = (e: FormEvent) => {
    e.preventDefault();
    if (!baseCurrency || !targetCurrency) {
      toast.error("Selecione ambas as moedas");
      return;
    }
    fetchExchangeRate(baseCurrency, targetCurrency);
  };

  return (
    <div className="bg-slate-800 w-full max-w-2xl p-6 rounded-xl border border-slate-600 flex flex-col gap-5">
      <form
        onSubmit={searchExchangeRate}
        className="flex flex-col justify-center gap-2"
      >
        <h1 className="flex justify-center items-center gap-2 text-white font-bold text-xl">
          <BadgeJapaneseYen
            size={28}
            className="text-yellow-500 yen-icon bitcoin-iccon"
          />
          <span className="text-yellow-500 font-bold text-lg">
            Buscar taxa de câmbio entre moedas
          </span>
        </h1>


        {/* Inputs e botões para buscar taxa de câmbio */}
        <div className="flex gap-2">
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value as CurrencyCode)}
            className="flex-1 w-full h-12 p-3 rounded-md bg-slate-950 text-white border border-slate-600 outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} — {c.name}
              </option>
            ))}
          </select>

          <select
            value={targetCurrency}
            onChange={(e) => setTargetCurrency(e.target.value as CurrencyCode)}
            className="flex-1 w-full h-12 p-3 rounded-md bg-slate-950 text-white border border-slate-600 outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} — {c.name}
              </option>
            ))}
          </select>

        </div>
      </form>
      <h2 className="text-white text-1xl font-bold">Taxa Cambial Entre {baseCurrency} e {targetCurrency}</h2>
      <p className="text-cyan-300 text-xl cripto-brl rounded-md  font-bold">
        {exchange
          ? `1 ${exchange.base} = ${exchange.formattedRate} ${exchange.target}`
          : "Nenhuma taxa de câmbio encontrada"}
      </p>
    </div>
  );
}
