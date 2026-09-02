// Mock estruturado como "Operacional/Contratos/Equipes_por_Contrato.xlsx" (SharePoint).
// Funcionalidade específica Maxpesa: cada membro da equipe de um contrato só
// pode operar se TODOS os requisitos abaixo estiverem em dia. Se qualquer um
// estiver vencido, o sistema bloqueia automaticamente o colaborador.

function membro(nome, funcao, requisitos) {
  const bloqueado = Object.values(requisitos).some((v) => v === false);
  return { nome, funcao, requisitos, bloqueado };
}

export const CONTRATOS = [];