// Mock estruturado como "RH/Admissao_Digital/Checklist_Admissoes.xlsx" (SharePoint).

export const ADMISSOES = [
  {
    id: "ADM-1",
    nome: "Thiago Almeida",
    cargo: "Motorista",
    filial: "Filial - Santos",
    dataPrevista: "2026-08-20",
    checklist: {
      dadosPessoais: true,
      documentos: true,
      exameAdmissional: true,
      assinaturaContrato: false,
      integracaoDominio: false,
    },
  },
  {
    id: "ADM-2",
    nome: "Camila Nogueira",
    cargo: "Técnica de Segurança do Trabalho",
    filial: "Matriz - Campinas",
    dataPrevista: "2026-08-25",
    checklist: {
      dadosPessoais: true,
      documentos: false,
      exameAdmissional: false,
      assinaturaContrato: false,
      integracaoDominio: false,
    },
  },
];
