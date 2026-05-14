import type { CryptoData } from '../types/CriptoType';

export async function getCryptoPrice(coin: string): Promise<CryptoData> {
    try {
    const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=brl`
    );

    if (!response.ok) throw new Error('Erro ao buscar crypto');

    const data = await response.json();

    // Verificar se a moeda existe na resposta
    if (!data[coin]) {
    throw new Error(`Moeda "${coin}" não encontrada ou não existe`);
    
}
    const price: number = data[coin.toLocaleLowerCase()].brl;

    return {
        name: coin,
        price: price,
        formattedPrice: price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
        }),
        currency: 'BRL'
    };
    } catch (error) {
        console.error(error);
        throw error;
    }
}



