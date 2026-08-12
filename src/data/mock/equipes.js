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
    cliente: "Vale S.A.",
    local: "Terminal de Santos",
    supervisor: "Carlos Menezes",
    membros: [
      membro("João Pereira", "Operador", {
        aso: true,
        cnh: true,
        nr: true,
        integracaoCliente: true,
        epi: true,
        certificados: true,
      }),
      membro("Marcos Vinícius Souza", "Rigger", {
        aso: true,
        cnh: true,
        nr: true,
        integracaoCliente: true,
        epi: true,
        certificados: true,
      }),
      membro("Rafael Souto", "Sinaleiro", {
        aso: false, // ASO vencido
        cnh: true,
        nr: true,
        integracaoCliente: true,
        epi: true,
        certificados: true,
      }),
      membro("Eduardo Farias", "Motorista", {
        aso: true,
        cnh: false, // CNH vencida
        nr: true,
        integracaoCliente: true,
        epi: true,
        certificados: true,
      }),
    ],
  },
  {
    id: "CT-2026-021",
    cliente: "Petrobras",
    local: "Porto de Santos",
    supervisor: "Carlos Menezes",
    membros: [
      membro("Diego Alves", "Operador", {
        aso: false, // ASO vencido (admissional expirado)
        cnh: true,
        nr: false, // NR-33 vencendo tratado como pendente
        integracaoCliente: true,
        epi: false, // óculos de proteção pendente
        certificados: true,
      }),
      membro("Patrícia Lima", "Técnico de Segurança", {
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
