// BrasilAPI — GET /api/banks e /api/banks/{code}
export interface Bank {
  ispb: string;
  name: string;
  code: number;
  fullName: string;
}

// `DataBank`, `Card` e `CardType` foram removidos junto com o onboarding de
// dados bancários. Serviam a um formulário que gravava número de cartão e CVV em
// texto puro no localStorage, e nenhum desses campos existia no backend.
// A lista de bancos da BrasilAPI continua servindo /dashboard/brasil/bancos.
