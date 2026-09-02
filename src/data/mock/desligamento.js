// Mock estruturado como "RH/Desligamento/Checklist_Desligamentos.xlsx" (SharePoint).
// colaboradorId referencia COLABORADORES (data/mock/colaboradores.js).

export const DESLIGAMENTOS = [
  {
    id: "DESL-1",
    colaboradorId: "C-1006",
    motivo: "Sem justa causa",
    dataDesligamento: "2026-09-10",
    checklist: {
      entrevistaDesligamento: true,
      devolucaoEquipamentos: true,
      exameDemissional: true,
      acertoRescisorio: false,
      homologacaoSindicato: false,
      baixaDominio: false,
    },
  },
  {
    id: "DESL-2",
    colaboradorId: "C-1004",
    motivo: "Pedido de demissão",
    dataDesligamento: "2026-09-18",
    checklist: {
      entrevistaDesligamento: true,
      devolucaoEquipamentos: false,
      exameDemissional: false,
      acertoRescisorio: false,
      homologacaoSindicato: false,
      baixaDominio: false,
    },
  },
  {
    id: "DESL-3",
    colaboradorId: "C-1002",
    motivo: "Fim de contrato",
    dataDesligamento: "2026-08-30",
    checklist: {
      entrevistaDesligamento: true,
      devolucaoEquipamentos: true,
      exameDemissional: true,
      acertoRescisorio: true,
      homologacaoSindicato: true,
      baixaDominio: false,
    },
  },
];
