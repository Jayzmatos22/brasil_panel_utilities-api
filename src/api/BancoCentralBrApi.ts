
import axios from 'axios';
export { getSelicData, getIpcaData, getDollarPtax, getSelicHistory, getCdiRate };


export interface FinancialData {
  selic: SelicData;   
  ipca: IpcaData;    
  dollarPtax: number; 
  cdi: number;        
}

// Função para obter todas as taxas financeiras
export async function getFinancialData(): Promise<FinancialData> {
  const [selic, ipca, dollarPtax, cdi] = await Promise.all([
    getSelicData(),
    getIpcaData(),
    getDollarPtax(),
    getCdiRate(),
  ]);

  const values = [selic, ipca, dollarPtax, cdi];

  if (!values) throw new Error('Erro ao obter dados financeiros');
  if (values.some(value => value === undefined || value === null)) {
    throw new Error('Dados financeiros incompletos');
    
  }

  return { selic, ipca, dollarPtax, cdi };
}




//Api da taxa Selic
export interface SelicData {
  currentRate: number;       // taxa meta atual
  accumulatedMonth: number;  // acumulada no mês
  accumulatedYear: number;   // acumulada no ano
  last12MonthsCompound: number; // últimos 12 compostos
}

async function getSelicData(): Promise<SelicData> {
  const [current, month, year, historico] = await Promise.all([
    axios.get('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json'),
    axios.get('https://api.bcb.gov.br/dados/serie/bcdata.sgs.1178/dados/ultimos/1?formato=json'),
    axios.get('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4189/dados/ultimos/1?formato=json'),
    axios.get('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/12?formato=json'),
  ]);

  const last12Compound = (
    historico.data.reduce((acc: number, entry: { valor: string }) =>
      acc * (1 + parseFloat(entry.valor) / 100), 1) - 1
  ) * 100;

  const values = [current, month, year, historico];
  if (values.some(value => !value || !value.data || value.data.length === 0)) {
    throw new Error('Dados Selic incompletos');
  }

  return {
    currentRate: parseFloat(current.data[0].valor),
    accumulatedMonth: parseFloat(month.data[0].valor),
    accumulatedYear: parseFloat(year.data[0].valor),
    last12MonthsCompound: parseFloat(last12Compound.toFixed(2)),
  };
}







// IPCA (inflação)
interface IpcaData {
  currentMonth: number;        // IPCA do mês atual
  accumulatedYear: number;     // Acumulado ano vigente (oficial BCB)
  last12MonthsSum: number;     // Últimos 12 meses — soma simples
  last12MonthsCompound: number; // Últimos 12 meses — composição correta
}   
async function getIpcaData(): Promise<IpcaData> {
  const [mes, acumulado, historico] = await Promise.all([

    // 1. IPCA do mês atual
    axios.get('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json'),

    // 2. Acumulado ano vigente — série específica do BCB
    axios.get('https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json'),

    // 3. Últimos 12 meses pra calcular
    axios.get('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/12?formato=json'),
  ]);

  // Soma simples
  // 3 casas decimais
  const last12Sum = historico.data
    .reduce((acc: number, entry: { valor: string }) => acc + parseFloat(entry.valor), 0).toFixed(3);

  // Composição
  const last12Compound = (
    historico.data.reduce((acc: number, entry: { valor: string }) =>
      acc * (1 + parseFloat(entry.valor) / 100), 1) - 1
  ) * 100;

  return {
    currentMonth: parseFloat(mes.data[0].valor),
    accumulatedYear: parseFloat(acumulado.data[0].valor),
    last12MonthsSum: parseFloat(last12Sum.toFixed(2)),
    last12MonthsCompound: parseFloat(last12Compound.toFixed(2)),
  };
}




// Dólar PTAX
async function getDollarPtax() {
  const { data } = await axios.get(
    'https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json'
  );
  if (!data || data.length === 0) {
    throw new Error('Dados do dólar PTAX indisponíveis');
  }
  return parseFloat(data[0].valor);
}






// CDI  
async function getCdiRate() {
  const { data } = await axios.get(
    'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json'
  );
  if (!data || data.length === 0) {
    throw new Error('Dados da taxa CDI indisponíveis');
  }
  return parseFloat(data[0].valor);
}








// Histórico últimos 12 meses
// Tipo da API 
interface SelicApiResponse {
  data: string;
  valor: string;
}

// Tipo do app 
interface SelicHistoryEntry {
  date: string;
  value: number;
}

async function getSelicHistory(): Promise<SelicHistoryEntry[]> {
  const { data } = await axios.get('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/12?formato=json');

  // Array com conteúdo
  if (!Array.isArray(data)) throw new Error('Resposta inesperada da API');
  if (data.length === 0) throw new Error('Nenhum dado encontrado');

  // tipagem
  return data.map((entry: SelicApiResponse) => ({
    date: entry.data,
    value: parseFloat(entry.valor),
  }));
};

