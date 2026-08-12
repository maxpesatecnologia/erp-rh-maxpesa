// Mock estruturado como "RH/Indicadores/Dashboard_Executivo.xlsx" (SharePoint / Power BI dataset).

export const MESES = ["Set/25", "Out/25", "Nov/25", "Dez/25", "Jan/26", "Fev/26", "Mar/26", "Abr/26", "Mai/26", "Jun/26", "Jul/26", "Ago/26"];

export const HEADCOUNT_TREND = [168, 171, 173, 176, 177, 179, 180, 182, 183, 184, 184, 184];
export const TURNOVER_TREND = [3.1, 2.8, 3.4, 2.6, 2.2, 2.5, 2.1, 1.9, 2.6, 2.0, 1.8, 2.3];
export const ABSENTEISMO_TREND = [2.4, 2.6, 2.9, 3.3, 3.0, 2.7, 2.5, 2.8, 3.2, 2.9, 2.7, 3.1];
export const CERTIFICACOES_TREND = [91, 90, 89, 90, 88, 89, 90, 89, 88, 87, 88, 87];

export const KPIS = [
  { label: "Headcount ativo", value: "184", trend: "+4 no mês", direction: "up", icon: "Users", variant: "neutral", history: HEADCOUNT_TREND.slice(-8) },
  { label: "Turnover (mês)", value: "2,3%", trend: "-0,5 p.p.", direction: "up", icon: "TrendingDown", variant: "success", history: TURNOVER_TREND.slice(-8) },
  { label: "Absenteísmo (mês)", value: "3,1%", trend: "+0,4 p.p.", direction: "down", icon: "CalendarX", variant: "warning", history: ABSENTEISMO_TREND.slice(-8) },
  { label: "Certificações válidas", value: "87%", trend: "-3 p.p.", direction: "down", icon: "ShieldCheck", variant: "info", history: CERTIFICACOES_TREND.slice(-8) },
];

export const COMPOSICAO_FORCA_TRABALHO = [
  { label: "Ativos", value: 171 },
  { label: "Férias", value: 8 },
  { label: "Afastados", value: 5 },
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
