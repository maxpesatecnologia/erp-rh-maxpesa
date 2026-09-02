// Mock estruturado como "RH/Indicadores/Dashboard_Executivo.xlsx" (SharePoint / Power BI dataset).
//
// Headcount, turnover, treinamentos e composição da força de trabalho são
// calculados em Dashboard.jsx a partir de COLABORADORES/DESLIGAMENTOS/TREINAMENTOS
// (dados reais). Absenteísmo continua sintético aqui porque não existe nenhuma
// fonte de dado de frequência/ponto no app hoje — depende da integração futura
// com o relógio de ponto (ver pendências do README).

export const MESES = ["Set/25", "Out/25", "Nov/25", "Dez/25", "Jan/26", "Fev/26", "Mar/26", "Abr/26", "Mai/26", "Jun/26", "Jul/26", "Ago/26"];

export const ABSENTEISMO_TREND = [2.4, 2.6, 2.9, 3.3, 3.0, 2.7, 2.5, 2.8, 3.2, 2.9, 2.7, 3.1];

export const ABSENTEISMO_KPI = {
  label: "Absenteísmo (mês)",
  value: "3,1%",
  trend: "+0,4 p.p.",
  direction: "down",
  icon: "CalendarX",
  variant: "warning",
  history: ABSENTEISMO_TREND.slice(-8),
};

export const FERIAS_PROGRAMADAS = [
  { colaboradorId: "C-1003", inicio: "2026-08-18", fim: "2026-09-01", diasSaldo: 30 },
  { colaboradorId: "C-1004", inicio: "2026-09-15", fim: "2026-09-25", diasSaldo: 22 },
];

export const AFASTAMENTOS = [
  { colaboradorId: "C-1006", tipo: "Auxílio-doença", inicio: "2026-07-01", previsaoRetorno: "2026-09-01" },
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
