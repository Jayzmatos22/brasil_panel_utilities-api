import { useMacro } from '../hooks/UseIpea';

export default function MacroPanel() {
  const { data, isLoading, isError, error } = useMacro();

  if (isLoading) return <p className="text-yellow-500">Carregando...</p>;
  if (isError) return <p className="text-red-500">{error.message}</p>;

  return (
    <div className="flex flex-col gap-4">
      {data?.map((serie) => (
        <div key={serie.codigo} className="bg-slate-800 p-4 rounded-xl">
          <h3 className="text-white font-bold">{serie.nome}</h3>
          <p className="text-cyan-300">
            Último: {serie.dados[0]?.valor} ({serie.dados[0]?.data.slice(0, 7)})
          </p>
          <p className="text-slate-400 text-sm">
            {serie.dados.length} registros
          </p>
        </div>
      ))}
    </div>
  );
}