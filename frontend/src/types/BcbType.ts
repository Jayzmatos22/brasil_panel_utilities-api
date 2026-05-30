// Banco Central — GET /api/bcb/selic
export interface SelicData {
  currentRate: number;
  accumulatedMonth: number;
  accumulatedYear: number;
  last12MonthsCompound: number;
}

// Banco Central — GET /api/bcb/selic/history
export interface SelicHistoryItem {
  date: string;
  value: number;
}

// Banco Central — GET /api/bcb/ipca
export interface IpcaData {
  currentMonth: number;
  accumulatedYear: number;
  last12MonthsSum: number;
  last12MonthsCompound: number;
}

// Banco Central — GET /api/bcb/dollar-ptax
export interface DollarPtax {
  date: string;
  value: number;
}

// Banco Central — GET /api/bcb/cdi
export interface CdiData {
  date: string;
  value: number;
}

// Banco Central — GET /api/bcb/salario-minimo
export interface MinimumWage {
  data: string;
  valor: number;
}