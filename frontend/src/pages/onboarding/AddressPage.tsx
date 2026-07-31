import { useState } from 'react';
import { MapPinHouse, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useViaCep } from '../../hooks/UseViaCep';
import type { UserAddress } from '../../types/AddressUserType';
import type { User } from '../../types/UserType';

export default function AddressPage() {
  const [cep, setCep] = useState('');
  const [numero, setNumero] = useState('');
  const navigate = useNavigate();

  const { data: address, isFetching, isError } = useViaCep(cep);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      toast.error('Busque um CEP válido primeiro.');
      return;
    }
    if (!numero.trim()) {
      toast.error('Informe o número residencial.');
      return;
    }

    const currentUserRaw = localStorage.getItem('currentUser');
    if (!currentUserRaw) {
      toast.error('Nenhum usuário logado.');
      return;
    }

    const currentUser: User = JSON.parse(currentUserRaw);
    const userAddress: UserAddress = { ...address, numero };
    const updatedUser: User = { ...currentUser, address: userAddress };

    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    const storedUsers = localStorage.getItem('db_users');
    if (storedUsers) {
      const users: User[] = JSON.parse(storedUsers);
      const updatedUsers = users.map((u) =>
        u.email === currentUser.email ? updatedUser : u
      );
      localStorage.setItem('db_users', JSON.stringify(updatedUsers));
    }

    toast.success('Endereço salvo!', { duration: 2000 });
    navigate('/dados-bancarios');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <form
        onSubmit={handleSubmit}
        className="border border-gray-500 w-full max-w-md shadow-2xl flex flex-col p-card rounded-card bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <h2 className="text-white text-2xl flex items-center gap-3 tracking-wider border-b border-b-blue-300 pb-2">
            <MapPinHouse size={36} className="text-blue-400" />
            Dados de Endereço
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {/* CEP */}
          <div className="flex flex-col gap-2">
            <label className="text-white text-sm ml-1">CEP</label>
            <div className="relative">
              <input
                className="w-full h-12 p-3 rounded-md bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all border border-slate-600"
                type="text"
                inputMode="numeric"
                maxLength={9}
                placeholder="Ex: 01001-000"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
              />
              {isFetching && (
                <LoaderCircle
                  size={18}
                  className="absolute right-3 top-3.5 text-yellow-400 animate-spin"
                />
              )}
            </div>
            {isError && (
              <p className="text-red-400 text-xs ml-1">CEP não encontrado.</p>
            )}
          </div>

          {/* Campos retornados pelo backend */}
          {address && (
            <div className="flex flex-col gap-3 p-4 bg-slate-800 rounded-lg border border-slate-600 text-sm">
              <AddressField label="Logradouro" value={address.logradouro} />
              {address.complemento && (
                <AddressField label="Complemento" value={address.complemento} />
              )}
              <AddressField label="Bairro" value={address.bairro} />
              <div className="flex gap-4">
                <AddressField label="Cidade" value={address.localidade} />
                <AddressField label="UF" value={address.uf} />
                <AddressField label="DDD" value={address.ddd} />
              </div>
            </div>
          )}

          {/* Número */}
          <div className="flex flex-col gap-2">
            <label className="text-white text-sm ml-1">Número Residencial</label>
            <input
              className="w-full h-12 p-3 rounded-md bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all border border-slate-600"
              type="text"
              inputMode="numeric"
              placeholder="Ex: 123 ou 123A"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isFetching || !address}
            className="w-full h-12 bg-green-600 hover:bg-green-700 cursor-pointer text-white mt-3 font-bold rounded-md transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Salvar Endereço
          </button>
        </div>
      </form>
    </main>
  );
}

function AddressField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}