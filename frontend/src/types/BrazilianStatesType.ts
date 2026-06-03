// IBGE — GET /api/ibge/states

export interface Regiao {
  id: number;
  sigla: string;
  nome: string;
}

export interface Estado {
  id: number;
  sigla: string;
  nome: string;
  regiao: Regiao;
}

// IBGE — GET /api/ibge/states/ranking
export interface EstadoRanking {
  sigla: string;
  nome: string;
  totalMunicipios: number;
}
