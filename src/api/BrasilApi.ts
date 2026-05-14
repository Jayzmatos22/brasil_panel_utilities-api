
// modelo de dadsos para os bancos
export interface BankData {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string;
}

export interface BankByCodeData {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string;
}


export async function getAllBanks(): Promise<BankData[]> {
    const response = await fetch('https://brasilapi.com.br/api/banks/v1');
    if (!response.ok) throw new Error('Erro ao buscar bancos');
    return response.json();
}

// Buscar banco específico pelo código
export async function getBankByCode(code: number): Promise<BankByCodeData> {
    if (!code) {
        throw new Error('Código do banco é obrigatório');
    }

    if (isNaN(code)) {
        throw new Error('Código do banco deve ser um número');
    }

    const response = await fetch(`https://brasilapi.com.br/api/banks/v1/${code}`);
    if (!response.ok) throw new Error('Banco não encontrado');
    return response.json();
}



