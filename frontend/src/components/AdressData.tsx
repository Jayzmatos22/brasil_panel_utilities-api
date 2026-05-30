import { MapPinHouse } from 'lucide-react';
import { useState, type FormEvent } from "react";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAddressByCep } from '../api/services/ViaCep';
import { type User } from "../types/UserType";
import { viaCepService } from '../api/services/ViaCep';


export default function AddressUserData() {

    // As demais informações são automáticas pela API.
    const [numero, setNumero] = useState<string>('');
    const [cep, setCep] = useState<string>('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);


    const handleAddressData = async (e: FormEvent) => {
    e.preventDefault();

    // Validação só do que o ViaCepApi não cobre
    if (!numero.trim()) {
        toast.error('Por favor, insira o número residencial.');
        return;
    }

    const currentUserRaw = localStorage.getItem('currentUser');
    if (!currentUserRaw) {
        toast.error('Nenhum usuário logado.');
        return;
    }

    setLoading(true);
    try {
        // 1. Busca endereço 
        const response = await getAddressByCep(cep);

        // 2. Atualiza usuário com endereço + número
        const currentUser = JSON.parse(currentUserRaw);
        const updatedUser = {
            ...currentUser,
            endereco: { ...response, numero },
        };

        // 3. Salva currentUser
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        // 4. Sincroniza com db_users
        const storedUsers = localStorage.getItem('db_users');
        if (storedUsers) {
            const users = JSON.parse(storedUsers);
            const updatedUsers = users.map((u: User) =>
                u.email === currentUser.email ? updatedUser : u
            );
            localStorage.setItem('db_users', JSON.stringify(updatedUsers));
        }

        toast.success('Endereço salvo com sucesso!', { duration: 2500 });
        navigate('/dados-bancarios');
    } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
        setLoading(false);
    }
};

    return (
    <form
      onSubmit={handleAddressData}
      className="border-gray-500 border w-full max-w-md min-h-112.5 shadow-2xl flex flex-col p-10 rounded-xl bg-slate-900"
    >
      <div className="w-full flex items-center justify-center text-center mb-10">
        <h2 className="text-white register-font text-2xl flex border-b border-b-blue-300 items-center gap-3 tracking-wider">
          <MapPinHouse size={38} className="address-icon cursor-pointer" />
          Dados de Endereço
        </h2>
      </div>

      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-white text-sm ml-1">Endereço de CEP</label>
          <input
            className="w-full h-12 p-3 rounded-md   bg-data-input text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all border border-slate-600"
            type="text"
            inputMode="numeric"
            maxLength={9}
            placeholder="Ex: 01001-000"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-white text-sm ml-1">Número Residencial</label>
          <input
            className="w-full h-12 p-3 rounded-md  bg-data-input text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all border border-slate-600"
            type="text"
            inputMode="numeric"
            placeholder="Ex: 123 ou 123A"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-green-600 hover:bg-green-700 cursor-pointer text-white mt-5 font-bold rounded-md transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Buscando...' : 'Buscar Endereço'}
        </button>
      </div>
    </form>
  );
}

