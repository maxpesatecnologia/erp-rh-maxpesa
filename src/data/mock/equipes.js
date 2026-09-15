// Mock estruturado como "Operacional/Contratos/Equipes_por_Contrato.xlsx" (SharePoint).
// Funcionalidade específica Maxpesa: cada membro da equipe de um contrato só
// pode operar se TODOS os requisitos abaixo estiverem em dia. Se qualquer um
// estiver vencido, o sistema bloqueia automaticamente o colaborador.

function membro(nome, funcao, requisitos) {
  const bloqueado = Object.values(requisitos).some((v) => v === false);
  return { nome, funcao, requisitos, bloqueado };
}

export const CONTRATOS = [
  {
    id: "CT-2026-014",
    cliente: "Mineração Serra Azul",
    local: "Pátio de Britagem — Unidade Ouro Branco/MG",
    supervisor: "Carlos Eduardo Mendonça",
    membros: [
      membro("João Batista Ferreira", "Operador de Escavadeira", {
        aso: true,
        cnh: true,
        nr: true,
        integracaoCliente: true,
        epi: true,
        certificados: true,
      }),
      membro("Roberto Silva Nascimento", "Operador de Pá Carregadeira", {
        aso: true,
        cnh: true,
        nr: false,
        integracaoCliente: true,
        epi: true,
        certificados: true,
      }),
      membro("Marcos Vinícius Almeida", "Motorista de Caminhão Fora de Estrada", {
        aso: true,
        cnh: true,
        nr: true,
        integracaoCliente: true,
        epi: true,
        certificados: true,
      }),
      membro("Adriana Cristina Souza", "Encarregada de Pátio", {
        aso: false,
        cnh: true,
        nr: true,
        integracaoCliente: true,
        epi: true,
        certificados: true,
      }),
    ],
  },
  {
    id: "CT-2026-021",
    cliente: "Porto Novo Logística",
    local: "Terminal de Granéis — Cais 4",
    supervisor: "Fernanda Lopes Barreto",
    membros: [
      membro("Paulo Henrique Costa", "Operador de Empilhadeira", {
        aso: true,
        cnh: true,
        nr: true,
        integracaoCliente: true,
        epi: true,
        certificados: true,
      }),
      membro("Lucas Gabriel Martins", "Auxiliar de Movimentação de Carga", {
        aso: true,
        cnh: false,
        nr: true,
        integracaoCliente: false,
        epi: true,
        certificados: true,
      }),
      membro("Tatiane Regina Oliveira", "Sinaleira", {
        aso: true,
        cnh: false,
        nr: true,
        integracaoCliente: true,
        epi: true,
        certificados: true,
      }),
    ],
  },
  {
    id: "CT-2026-033",
    cliente: "Construtora Horizonte Engenharia",
    local: "Obra Duplicação Rodovia BR-262 — Trecho 3",
    supervisor: "Ricardo Tadeu Pereira",
    membros: [
      membro("Vinícius Rodrigues Cardoso", "Operador de Retroescavadeira", {
        aso: true,
        cnh: true,
        nr: true,
        integracaoCliente: true,
        epi: true,
        certificados: true,
      }),
      membro("Eduardo Henrique Farias", "Mecânico de Equipamentos Pesados", {
        aso: true,
        cnh: true,
        nr: true,
        integracaoCliente: true,
        epi: false,
        certificados: true,
      }),
      membro("Camila Aparecida Ribeiro", "Técnica de Segurança do Trabalho", {
        aso: true,
        cnh: true,
        nr: true,
        integracaoCliente: true,
        epi: true,
        certificados: false,
      }),
      membro("Felipe Augusto Teixeira", "Motorista de Caminhão Betoneira", {
        aso: true,
        cnh: true,
        nr: true,
        integracaoCliente: true,
        epi: true,
        certificados: true,
      }),
    ],
  },
];