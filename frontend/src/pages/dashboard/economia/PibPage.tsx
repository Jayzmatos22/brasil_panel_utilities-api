import { useCurrentPibBrazil, usePibBrazilByYear } from '../../../hooks/UseWorldBank';
import { LoaderCircle } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';


// API: World Bank
// Endpoints consumidos:
//   GET /worldbank/pib/current      → useCurrentPibBrazil()
//   GET /worldbank/pib/year/{year}  → usePibBrazilByYear(year)

export default function PibPage() {
    const [year, setYear] = useState<number>(2020);
    const { data: currentPib, isLoading: isCurrentPibLoading, error: currentPibError } = useCurrentPibBrazil();
    const { data: pibByYear,  isLoading: isPibByYearLoading,  error: pibByYearError  } = usePibBrazilByYear(year);


  const handleYearChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newYear = parseInt(e.target.value, 10);
    if (!isNaN(newYear)) {
      setYear(newYear);
    }
    if (e.target.value === '') {
      setYear(2020);
    }
  };




  return (
    <main>
      <h1 className="text-2xl font-bold mb-4">PIB do Brasil</h1>

      {/* PIB Atual */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">PIB Atual</h2>
        {isCurrentPibLoading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <LoaderCircle className="animate-spin" />
            Carregando...
          </div>
        ) : currentPibError ? (
          <div className="text-red-500">Erro ao carregar o PIB atual.</div>
        ) : currentPib ? (
          <div className="text-lg">
            Em {currentPib.year}, o PIB do Brasil foi de{' '}
            <span className="font-mono bg-yellow-500/20 px-1 rounded">{currentPib.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>.
          </div>
        ) : null}
      </section>
      
      {/* PIB por Ano */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Consultar PIB por Ano</h2>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="number"
            value={year}
            onChange={handleYearChange}
            className="w-24 p-2 border border-slate-600 rounded-md bg-slate-800 text-white focus:ring-2 focus:ring-yellow-500 transition-all"
            placeholder="Ano"
          />
          {isPibByYearLoading && (
            <div className="flex items-center gap-2 text-slate-400">
              <LoaderCircle className="animate-spin" />
              Carregando...
            </div>
          )}
        </div>
        {pibByYearError && (
          <div className="text-red-500">Erro ao carregar o PIB para o ano {year}.</div>
        )}
        {pibByYear && (
          <div className="text-lg">
            Em {pibByYear.year}, o PIB do Brasil foi de{' '}
            <span className="font-mono bg-yellow-500/20 px-1 rounded">{pibByYear.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>.
          </div>
        )}
      </section>
    </main>
  );
}
