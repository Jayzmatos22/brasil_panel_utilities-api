// IPEA — usado por todos os 6 endpoints:
// GET /api/ipea/emprego | /renda | /desigualdade | /macro | /precos | /populacao
// Cada endpoint retorna IpeaSerie[]

export interface IpeaItem {
  data: string;   // OffsetDateTime serializado como ISO 8601
  valor: number | null;
}

export interface IpeaSerie {
  codigo: string;
  nome: string;
  dados: IpeaItem[];
}