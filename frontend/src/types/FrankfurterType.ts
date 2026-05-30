// Frankfurter — GET /api/frankfurter?from=&to=&amount=
// rates é um mapa { "BRL": 6.15, "USD": 1.0 }
export interface FrankfurterRate {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Item de série histórica
export interface FrankfurterHistoryItem {
  date: string;
  rate: number;
}

// Frankfurter — GET /api/frankfurter/history e /api/frankfurter/last-30-days
export interface FrankfurterHistory {
  base: string;
  target: string;
  data: FrankfurterHistoryItem[];
}
