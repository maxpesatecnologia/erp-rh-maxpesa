// Mock estruturado como "SESMT/Seguranca_do_Trabalho/" (pastas e planilhas no SharePoint).

export const DOCUMENTOS_LEGAIS = [
  { id: "D-1", documento: "PGR - Programa de Gerenciamento de Riscos", filial: "Matriz - Campinas", emissao: "2025-01-10", validade: "2026-01-10", status: "Vencendo" },
  { id: "D-2", documento: "PCMSO - Programa de Controle Médico", filial: "Matriz - Campinas", emissao: "2025-03-01", validade: "2026-03-01", status: "Válido" },
  { id: "D-3", documento: "PGR - Programa de Gerenciamento de Riscos", filial: "Filial - Santos", emissao: "2024-06-15", validade: "2025-06-15", status: "Vencido" },
];

export const DDS_REGISTROS = [
  { id: "DDS-1", tema: "Uso correto de EPI em içamento", equipe: "Equipe Guindastes - Santos", data: "2026-08-04", participantes: 8 },
  { id: "DDS-2", tema: "Procedimento de içamento de cargas", equipe: "Equipe Guindastes - Santos", data: "2026-07-28", participantes: 7 },
  { id: "DDS-3", tema: "Trabalho em espaço confinado", equipe: "Equipe Transporte - Santos", data: "2026-07-21", participantes: 5 },
];

export const CATS = [
  { id: "CAT-1", colaborador: "Diego Alves", data: "2026-05-12", tipo: "Sem afastamento", descricao: "Pequeno corte durante manutenção de cabo de aço.", status: "Encerrado" },
];

export const APRS = [
  { id: "APR-1", atividade: "Içamento de módulo - Cliente Vale", equipe: "Equipe Guindastes - Santos", data: "2026-08-10", risco: "Alto", status: "Aprovado" },
  { id: "APR-2", atividade: "Movimentação de carga - Porto de Santos", equipe: "Equipe Guindastes - Santos", data: "2026-08-09", risco: "Médio", status: "Aprovado" },
];

export const INSPECOES = [
  { id: "INSP-1", item: "Guindaste 220t - Placa MP-220", tipo: "Inspeção mensal", data: "2026-08-01", resultado: "Conforme" },
  { id: "INSP-2", item: "Munck 30t - Placa MP-330", tipo: "Inspeção mensal", data: "2026-07-30", resultado: "Não conforme" },
];

export const NAO_CONFORMIDADES = [
  { id: "NC-1", origem: "Inspeção Munck 30t", descricao: "Cabo de aço com desgaste acima do permitido", planoAcao: "Substituição do cabo", responsavel: "Patrícia Lima", prazo: "2026-08-15", status: "Em andamento" },
];
