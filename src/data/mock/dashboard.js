// Mock estruturado como "RH/Indicadores/Dashboard_Executivo.xlsx" (SharePoint / Power BI dataset).

export const KPIS = [
  { label: "Headcount ativo", value: "184", trend: "+4 no mês", direction: "up" },
  { label: "Turnover (mês)", value: "2,3%", trend: "-0,5 p.p.", direction: "up" },
  { label: "Absenteísmo (mês)", value: "3,1%", trend: "+0,4 p.p.", direction: "down" },
  { label: "Certificações válidas", value: "87%", trend: "-3 p.p.", direction: "down" },
];

export const FERIAS_PROGRAMADAS = [
  { colaborador: "Ana Ribeiro", periodo: "18/08 a 01/09", diasSaldo: 30 },
  { colaborador: "Eduardo Farias", periodo: "01/09 a 10/09", diasSaldo: 22 },
];

export const AFASTAMENTOS = [
  { colaborador: "Eduardo Farias", tipo: "Auxílio-doença", inicio: "2026-07-01", previsaoRetorno: "2026-09-01" },
];

export const INDICADORES_POR_FILIAL = [
  { filial: "Matriz - Campinas", headcount: 62, turnover: "1,8%", absenteismo: "2,4%" },
  { filial: "Filial - Santos", headcount: 98, turnover: "2,9%", absenteismo: "3,8%" },
  { filial: "Filial - Vitória", headcount: 24, turnover: "1,2%", absenteismo: "1,9%" },
];

export const INDICADORES_POR_GESTOR = [
  { gestor: "Carlos Menezes", equipe: "Operações - Santos", headcount: 41, certificacoesValidas: "82%" },
  { gestor: "Admin Maxpesa", equipe: "RH / SESMT - Campinas", headcount: 18, certificacoesValidas: "95%" },
];

export const ORGANOGRAMA = {
  nome: "Diretoria Maxpesa",
  filhos: [
    {
      nome: "RH Corporativo (Ana Ribeiro)",
      filhos: [{ nome: "SESMT (Patrícia Lima)" }],
    },
    {
      nome: "Operações - Santos (Carlos Menezes)",
      filhos: [
        { nome: "Equipe Guindastes" },
        { nome: "Equipe Transporte" },
      ],
    },
  ],
};
