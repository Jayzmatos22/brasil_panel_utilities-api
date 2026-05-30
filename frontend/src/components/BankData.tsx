import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatternFormat, type NumberFormatValues } from 'react-number-format';
import { Building2, CreditCard, Save, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '../types/UserType';
import type { DataBank, Card, CardType } from '../types/BankDataType';
import { getAllBanks, type BankData } from '../api/BrasilApi';

export default function BankForm() {
  const navigate = useNavigate();

  const [banks, setBanks] = useState<BankData[]>([]);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<BankData | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [agency, setAgency] = useState('');
  const [numberAccount, setNumberAccount] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState<string>(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return '';
    const user: User = JSON.parse(raw);
    return user.name.toUpperCase();
  });
  const [expirationDate, setExpirationDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardType, setCardType] = useState<CardType>('NAO-INFORMADO');
  const [limit, setLimit] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) navigate('/login');
  }, [navigate]);

  useEffect(() => {
    getAllBanks()
      .then(data => setBanks(data.filter(b => b.name && b.code)))
      .catch(() => toast.error('Erro ao carregar bancos'));
  }, []);

  const filteredBanks = banks
    .filter(b =>
      b.name?.toLowerCase().includes(bankSearch.toLowerCase()) ||
      String(b.code)?.includes(bankSearch)
    )
    .slice(0, 8);

  const handleSelectBank = (bank: BankData) => {
    setSelectedBank(bank);
    setBankSearch(bank.name);
    setShowDropdown(false);
  };

  const isExpired = (expiry: string): boolean => {
    const [month, year] = expiry.split('/');
    const expMonth = parseInt(month);
    const expYear = parseInt(`20${year}`);
    const now = new Date();
    if (expYear < now.getFullYear()) return true;
    if (expYear === now.getFullYear() && expMonth < now.getMonth() + 1) return true;
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBank) { toast.error('Selecione um banco'); return; }
    if (agency.trim().length < 4) { toast.error('Agência inválida'); return; }
    if (numberAccount.trim().length < 5) { toast.error('Número de conta inválido'); return; }
    if (cardNumber.length > 0 && cardNumber.length < 16) { toast.error('Número do cartão inválido'); return; }
    if (expirationDate.length === 5 && isExpired(expirationDate)) { toast.error('Cartão expirado'); return; }

    const raw = localStorage.getItem('currentUser');
    if (!raw) { toast.error('Sessão expirada'); navigate('/login'); return; }

    const currentUser: User = JSON.parse(raw);

    const card: Card = {
      cardNumber: cardNumber.replace(/\s/g, ''),
      cardholderName: cardholderName.toUpperCase(),
      expirationDate,
      cvv,
      type: cardType,
      ...(limit ? { limit: parseFloat(limit) } : {})
    };

    const bank: DataBank = {
      idAccount: currentUser.bank.idAccount,
      holder: currentUser.name,
      agency,
      numberAccount,
      bankName: selectedBank.name,
      balance: currentUser.bank.balance,
      status: 'ATIVA',
      card
    };

    const updatedUser: User = { ...currentUser, bank };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    const rawList = localStorage.getItem('db_users');
    if (rawList) {
      const list: User[] = JSON.parse(rawList);
      const updated = list.map(u =>
        u.idUserAccount === updatedUser.idUserAccount ? updatedUser : u
      );
      localStorage.setItem('db_users', JSON.stringify(updated));
    }

    toast.success('Dados bancários salvos!');
    navigate('/dashboard');
  };

  const inputClass = "w-full h-12 p-3 rounded-md bg-slate-950 text-white placeholder-slate-500 border border-slate-600 outline-none focus:ring-2 focus:ring-yellow-500 transition-all";
  const labelClass = "text-white text-sm mb-1";

  return (
    <form onSubmit={handleSubmit}
      className="w-full max-w-4xl bg-slate-900 border border-slate-700 p-8 rounded-xl shadow-lg flex flex-col gap-6">

      {/* TÍTULO */}
      <div className="flex items-center gap-2 border-b border-slate-700 pb-4">
        <Building2 size={50} className="text-yellow-500  bank-data-form-icons" />
        <h2 className="text-white font-bold text-xl">Dados Bancários e Cartão</h2>
      </div>

      {/* GRID HORIZONTAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* COLUNA ESQUERDA — BANCO */}
        <div className="flex flex-col gap-4">
          <h3 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
            <Landmark size={40} className="bank-data-form-icons" />
            Conta Bancária
          </h3>

          {/* Busca de banco */}
          <div className="relative flex flex-col gap-1">
            <label className={labelClass}>Banco</label>
            <input
              value={bankSearch}
              onChange={(e) => { setBankSearch(e.target.value); setShowDropdown(true); setSelectedBank(null); }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Ex: Itaú, Nubank, 341..."
              className={inputClass}
            />
            {showDropdown && bankSearch && !selectedBank && filteredBanks.length > 0 && (
              <ul className="absolute top-full mt-1 w-full bg-slate-800 border border-slate-600 
                             rounded-lg max-h-48 overflow-y-auto z-50 shadow-xl">
                {filteredBanks.map(bank => (
                  <li key={bank.ispb}
                    onClick={() => handleSelectBank(bank)}
                    className="p-3 hover:bg-slate-700 cursor-pointer text-white text-sm 
                               flex justify-between border-b border-slate-700 last:border-0">
                    <span>{bank.name}</span>
                    <span className="text-slate-400 text-xs">Cód. {bank.code}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Agência e Conta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Agência</label>
              <input value={agency} onChange={e => setAgency(e.target.value)}
                placeholder="0000" maxLength={10} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Conta</label>
              <input value={numberAccount} onChange={e => setNumberAccount(e.target.value)}
                placeholder="00000-0" maxLength={15} className={inputClass} />
            </div>
          </div>

          {/* Limite */}
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Limite (opcional)</label>
            <input type="number" value={limit}
              onChange={e => setLimit(e.target.value)}
              placeholder="R$ 0,00" min={0} className={inputClass} />
          </div>
        </div>

        {/* COLUNA DIREITA — CARTÃO */}
        <div className="flex flex-col gap-4">
          <h3 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
            <CreditCard size={40} className="bank-data-form-icons" />
            Dados do Cartão
          </h3>

          {/* Número do cartão */}
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Número do Cartão</label>
            <PatternFormat
              format="#### #### #### ####"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onValueChange={(v: NumberFormatValues) => setCardNumber(v.value)}
              className={inputClass}
            />
          </div>

          {/* Nome no cartão */}
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Nome no Cartão</label>
            <input value={cardholderName}
              onChange={e => setCardholderName(e.target.value.toUpperCase())}
              placeholder="NOME SOBRENOME" className={inputClass} />
          </div>

          {/* Validade, CVV, Tipo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Validade</label>
              <PatternFormat format="##/##" placeholder="MM/AA"
                value={expirationDate}
                onValueChange={(v: NumberFormatValues) => setExpirationDate(v.formattedValue)}
                className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>CVV</label>
              <PatternFormat format="###" placeholder="000"
                value={cvv}
                onValueChange={(v: NumberFormatValues) => setCvv(v.value)}
                className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Tipo</label>
              <select value={cardType}
                onChange={e => setCardType(e.target.value as CardType)}
                className={inputClass}>
                <option value="NAO-INFORMADO">Não informado</option>
                <option value="CREDITO">Crédito</option>
                <option value="DEBITO">Débito</option>
                <option value="MULTIPLO">Múltiplo</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÃO */}
      <div className="border-t border-slate-700 pt-4">
        <button type="submit"
          className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-white font-bold 
                     rounded-md transition-all cursor-pointer flex items-center justify-center gap-2">
          <Save size={18} />
          Salvar Dados Bancários
        </button>
      </div>
    </form>
  );
}