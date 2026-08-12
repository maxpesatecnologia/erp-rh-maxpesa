// Motor de respostas simplificado da "IA Corporativa" — hoje roda 100% em
// cima dos dados mockados (simulando o que viria do SharePoint/Domínio).
// Em produção isso seria substituído por um agente com acesso às mesmas
// fontes de dados via API (RAG sobre os documentos do SharePoint + consultas
// estruturadas às tabelas do Supabase / Domínio Sistemas).

import { TREINAMENTOS } from "../data/mock/treinamentos";
import { EXAMES_ASO } from "../data/mock/medicina";
import { CONTRATOS } from "../data/mock/equipes";
import { OPERADORES } from "../data/mock/operadores";

export const SUGESTOES = [
  "Minha NR35 vence quando?",
  "Meu ASO está válido?",
  "Quais treinamentos preciso fazer?",
  "Onde encontro o procedimento de içamento?",
  "Quem é o supervisor da equipe de Campinas?",
  "Quais operadores estão aptos para um guindaste de 220 toneladas?",
];

function encontrarPorNome(lista, nomeParcial, campoNome) {
  const termo = nomeParcial.toLowerCase();
  return lista.filter((item) => item[campoNome].toLowerCase().includes(termo));
}

export function responder(pergunta, usuarioLogado) {
  const q = pergunta.toLowerCase();
  const nomeUsuario = usuarioLogado?.nome ?? "";

  if (q.includes("nr35") || q.includes("nr 35")) {
    const registros = encontrarPorNome(TREINAMENTOS, nomeUsuario, "colaborador").filter((t) =>
      t.curso.toLowerCase().includes("nr-35")
    );
    if (registros.length > 0) {
      const r = registros[0];
      return `${r.colaborador}, sua NR-35 (${r.curso}) tem validade até ${r.validade} — status atual: ${r.status}.`;
    }
    return "Não encontrei um registro de NR-35 para o seu usuário nos dados de demonstração. Em produção, eu consultaria diretamente sua ficha de treinamentos.";
  }

  if (q.includes("aso")) {
    const registros = encontrarPorNome(EXAMES_ASO, nomeUsuario, "colaborador");
    if (registros.length > 0) {
      const r = registros[0];
      return `Seu ASO (${r.tipo}) está com validade até ${r.validade} — status: ${r.status}.`;
    }
    return "Não encontrei um ASO cadastrado para o seu usuário nos dados de demonstração.";
  }

  if (q.includes("treinamento")) {
    const pendentes = TREINAMENTOS.filter((t) => t.status !== "Válido");
    if (pendentes.length === 0) return "Não há treinamentos pendentes registrados no momento.";
    return `Treinamentos que precisam de atenção agora: ${pendentes
      .map((t) => `${t.curso} (${t.colaborador} — ${t.status})`)
      .join("; ")}.`;
  }

  if (q.includes("içamento") || q.includes("icamento")) {
    return "O procedimento de içamento está em: SharePoint › Segurança do Trabalho › Procedimentos Operacionais › PO-012-Icamento_de_Cargas.pdf. (Em produção este link abriria o documento direto do SharePoint.)";
  }

  if (q.includes("supervisor") && q.includes("campinas")) {
    return "Não há contrato ativo cadastrado em Campinas nos dados de demonstração — os contratos atuais são em Santos (Vale S.A. e Petrobras), supervisionados por Carlos Menezes.";
  }

  if (q.includes("supervisor")) {
    const nomes = [...new Set(CONTRATOS.map((c) => `${c.local}: ${c.supervisor}`))];
    return `Supervisores por contrato/local: ${nomes.join(" · ")}.`;
  }

  if (q.includes("220") && q.includes("guindaste")) {
    const aptos = OPERADORES.filter(
      (o) => o.equipamentosHabilitados.some((e) => e.includes("220")) && o.aptidaoMedica === "Válido" && o.disponibilidade !== "Bloqueado"
    );
    if (aptos.length === 0) return "Nenhum operador está apto no momento para o guindaste de 220 toneladas.";
    return `Operadores aptos para o guindaste de 220t: ${aptos.map((o) => `${o.nome} (${o.disponibilidade})`).join(", ")}.`;
  }

  return "Ainda não tenho uma resposta treinada para essa pergunta neste protótipo. Em produção, a IA Corporativa consultaria o SharePoint, o Domínio Sistemas e o cadastro de colaboradores/operadores para responder.";
}
