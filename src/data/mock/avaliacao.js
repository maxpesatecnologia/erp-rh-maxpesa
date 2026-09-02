// Mock estruturado como "RH/Desempenho/Avaliacoes_PDI.xlsx" (SharePoint).
// colaboradorId referencia COLABORADORES (data/mock/colaboradores.js).

export const AVALIACOES = [
  {
    id: "AVAL-1",
    colaboradorId: "C-1001",
    ciclo: "2026 - 1º Semestre",
    nota: 8.5,
    status: "Concluído",
    competencias: [
      { nome: "Segurança operacional", nota: 9 },
      { nome: "Técnica de içamento", nota: 8 },
      { nome: "Trabalho em equipe", nota: 8.5 },
    ],
    metas: [
      { descricao: "Zero acidentes no semestre", status: "Concluído" },
      { descricao: "Concluir reciclagem NR-11", status: "Concluído" },
    ],
    pdi: [
      { acao: "Curso de operador de guindaste de grande porte", prazo: "2026-11-30", status: "Em andamento" },
    ],
  },
  {
    id: "AVAL-2",
    colaboradorId: "C-1002",
    ciclo: "2026 - 1º Semestre",
    nota: 6.5,
    status: "Em andamento",
    competencias: [
      { nome: "Segurança operacional", nota: 7 },
      { nome: "Amarração de carga", nota: 6 },
    ],
    metas: [
      { descricao: "Reduzir tempo médio de amarração", status: "Em andamento" },
    ],
    pdi: [
      { acao: "Treinamento de reciclagem Rigger Nível II", prazo: "2026-10-15", status: "Pendente" },
    ],
  },
  {
    id: "AVAL-3",
    colaboradorId: "C-1004",
    ciclo: "2026 - 1º Semestre",
    nota: 7,
    status: "Pendente",
    competencias: [
      { nome: "Comunicação de sinais", nota: 7 },
      { nome: "Atenção e postura de segurança", nota: 7 },
    ],
    metas: [
      { descricao: "Concluir avaliação de desempenho com gestor", status: "Atrasado" },
    ],
    pdi: [
      { acao: "Curso de sinaleiro avançado", prazo: "2026-12-01", status: "Pendente" },
    ],
  },
  {
    id: "AVAL-4",
    colaboradorId: "C-1003",
    ciclo: "2026 - 1º Semestre",
    nota: 9,
    status: "Concluído",
    competencias: [
      { nome: "Gestão de pessoas", nota: 9 },
      { nome: "Recrutamento e seleção", nota: 9 },
      { nome: "Comunicação", nota: 9 },
    ],
    metas: [
      { descricao: "Reduzir tempo médio de contratação", status: "Concluído" },
    ],
    pdi: [
      { acao: "Certificação em gestão estratégica de pessoas", prazo: "2027-03-01", status: "Em andamento" },
    ],
  },
  {
    id: "AVAL-5",
    colaboradorId: "C-1005",
    ciclo: "2026 - 1º Semestre",
    nota: 8,
    status: "Em andamento",
    competencias: [
      { nome: "Gestão de riscos", nota: 8 },
      { nome: "Auditoria de segurança", nota: 8 },
    ],
    metas: [
      { descricao: "Zerar não conformidades em auditoria interna", status: "Em andamento" },
    ],
    pdi: [
      { acao: "Especialização em Engenharia de Segurança", prazo: "2027-06-30", status: "Em andamento" },
    ],
  },
];
