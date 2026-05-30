// BrasilAPI — GET /api/banks e /api/banks/{code}
export interface Bank {
  ispb: string;
  name: string;
  code: number;
  fullName: string;
}

// ─── Conta bancária do usuário (dados internos do app, não vêm do backend) ───

export type StatusAccount = 'ATIVA' | 'DESATIVADA' | 'BLOQUEADA';
export type CardType = 'CREDITO' | 'DEBITO' | 'MULTIPLO' | 'NAO-INFORMADO';

export interface Card {
  cardNumber: string;
  cardholderName: string;
  expirationDate: string;
  cvv: string;
  type: CardType;
  limit?: number;
}

export interface DataBank {
  idAccount: string;
  holder: string;
  agency: string;
  numberAccount: string;
  bankName?: string;
  balance: number;
  status: StatusAccount;
  card: Card;
}
