// Mock estruturado como "SESMT/EPIs/Estoque_e_Entregas.xlsx" (SharePoint).

export const ESTOQUE_EPI = [
  { id: "EPI-1", item: "Cinto de segurança tipo paraquedista", estoqueAtual: 18, estoqueMinimo: 10, status: "OK" },
  { id: "EPI-2", item: "Capacete com jugular", estoqueAtual: 6, estoqueMinimo: 15, status: "Baixo" },
  { id: "EPI-3", item: "Luva de raspa", estoqueAtual: 40, estoqueMinimo: 20, status: "OK" },
  { id: "EPI-4", item: "Óculos de proteção", estoqueAtual: 3, estoqueMinimo: 15, status: "Crítico" },
];

export const ENTREGAS_EPI = [
  { id: "ENT-1", colaborador: "João Pereira", item: "Cinto de segurança tipo paraquedista", data: "2026-06-01", validade: "2027-06-01", assinatura: "Assinado" },
  { id: "ENT-2", colaborador: "Rafael Souto", item: "Capacete com jugular", data: "2025-05-15", validade: "2026-05-15", assinatura: "Assinado" },
  { id: "ENT-3", colaborador: "Diego Alves", item: "Óculos de proteção", data: "2024-04-20", validade: "2025-04-20", assinatura: "Pendente" },
];
