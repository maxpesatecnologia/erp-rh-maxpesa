// Mock estruturado como "RH/Indicadores/Dashboard_Executivo.xlsx" (SharePoint / Power BI dataset).
//
// Headcount, turnover, treinamentos e composição da força de trabalho são
// calculados em Dashboard.jsx a partir de COLABORADORES/DESLIGAMENTOS/TREINAMENTOS
// (dados reais). Absenteísmo continua sintético aqui porque não existe nenhuma
// fonte de dado de frequência/ponto no app hoje — depende da integração futura
// com o relógio de ponto (ver pendências do README).

export const MESES = ["Set/25", "Out/25", "Nov/25", "Dez/25", "Jan/26", "Fev/26", "Mar/26", "Abr/26", "Mai/26", "Jun/26", "Jul/26", "Ago/26"];

export const ABSENTEISMO_TREND = MESES.map(() => 0);

export const ABSENTEISMO_KPI = {
  label: "Absenteísmo (mês)",
  value: "0%",
  trend: "0 p.p.",
  direction: "down",
  icon: "CalendarX",
  variant: "warning",
  history: ABSENTEISMO_TREND.slice(-8),
};

export const FERIAS_PROGRAMADAS = [];

export const AFASTAMENTOS = [];

export const ORGANOGRAMA = {
  nome: "Diretoria Maxpesa",
  filhos: [],
};