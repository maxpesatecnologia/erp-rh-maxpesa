// Mock estruturado como "SESMT/Medicina_Ocupacional/Controle_ASO.xlsx" (SharePoint).

export const EXAMES_ASO = [
  { id: "ASO-1", colaborador: "João Pereira", tipo: "Periódico", clinica: "Clínica SaudeOcupa - Santos", data: "2026-01-15", validade: "2027-01-15", status: "Válido" },
  { id: "ASO-2", colaborador: "Marcos Vinícius Souza", tipo: "Periódico", clinica: "Clínica SaudeOcupa - Santos", data: "2025-08-20", validade: "2026-08-20", status: "Vencendo" },
  { id: "ASO-3", colaborador: "Rafael Souto", tipo: "Periódico", clinica: "Clínica SaudeOcupa - Santos", data: "2025-01-10", validade: "2026-01-10", status: "Vencido" },
  { id: "ASO-4", colaborador: "Diego Alves", tipo: "Admissional", clinica: "Clínica SaudeOcupa - Santos", data: "2024-03-05", validade: "2025-03-05", status: "Vencido" },
  { id: "ASO-5", colaborador: "Patrícia Lima", tipo: "Periódico", clinica: "Clínica Vida Campinas", data: "2026-03-01", validade: "2027-03-01", status: "Válido" },
];

export const VACINAS = [
  { id: "VAC-1", colaborador: "João Pereira", vacina: "Tétano", data: "2024-02-10", validade: "2029-02-10", status: "Válido" },
  { id: "VAC-2", colaborador: "Rafael Souto", vacina: "Febre Amarela", data: "2016-06-01", validade: "Dose única", status: "Válido" },
];

export const CLINICAS = [
  { id: "CL-1", nome: "Clínica SaudeOcupa - Santos", cidade: "Santos", contrato: "Ativo" },
  { id: "CL-2", nome: "Clínica Vida Campinas", cidade: "Campinas", contrato: "Ativo" },
];
