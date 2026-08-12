// Mock estruturado como "Comunicacao/Mural/" no SharePoint.

export const COMUNICADOS = [
  {
    id: "COM-1",
    titulo: "Novo procedimento de içamento entra em vigor em setembro",
    autor: "SESMT",
    data: "2026-08-09",
    conteudo:
      "A partir de 01/09, todas as operações de içamento acima de 100t deverão seguir o novo checklist de APR digital. Treinamento obrigatório será agendado pelas gestoras de equipe.",
  },
  {
    id: "COM-2",
    titulo: "Campanha de vacinação contra a gripe",
    autor: "Medicina Ocupacional",
    data: "2026-08-05",
    conteudo:
      "As clínicas parceiras estarão disponíveis para vacinação gratuita até 31/08. Agende pelo Portal do Colaborador.",
  },
  {
    id: "COM-3",
    titulo: "Resultado da pesquisa de clima organizacional",
    autor: "RH Corporativo",
    data: "2026-07-28",
    conteudo: "Agradecemos a participação de 92% dos colaboradores. Os resultados completos serão apresentados na próxima reunião de equipe.",
  },
];

export const ANIVERSARIANTES = [
  { nome: "Patrícia Lima", data: "2026-08-14" },
  { nome: "Diego Alves", data: "2026-08-22" },
];

export const ENQUETES = [
  {
    id: "ENQ-1",
    pergunta: "Qual horário você prefere para os treinamentos de reciclagem NR?",
    opcoes: [
      { texto: "Manhã", votos: 34 },
      { texto: "Tarde", votos: 21 },
      { texto: "Noite", votos: 9 },
    ],
  },
];
