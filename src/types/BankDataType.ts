// 1. O Cardápio de Status e Tipos
export type StatusAccount = "ATIVA" | "DESATIVADA" | "BLOQUEADA";
export type CardType = "CREDITO" | "DEBITO" | "MULTIPLO";

//  Interface do Cartão
export interface Card {
    cardNumber: string; 
    cardholderName: string;
    expirationDate: string;
    cvv: string;
    type: CardType;
    limit?: number;
}

// A Conta Bancária
export interface DataBank {
    idAccount: string; 
    holder: string;
    agency: string;
    numberAccount: string;
    balance: number;
    status: StatusAccount;
    cards: Card[];
}
