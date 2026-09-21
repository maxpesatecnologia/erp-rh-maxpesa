// Max, a IA da Maxpesa — assistente de RH / Departamento Pessoal (RH/DP).
//
// Em produção (Supabase configurado), a pergunta é enviada para a Edge Function
// `ia-corporativa` (ver supabase/functions/ia-corporativa/index.ts), que chama a
// API do Google Gemini com um system prompt restrito a assuntos de RH/DP —
// a API key nunca fica no front-end.
//
// Sem Supabase configurado (modo demo) ou se a function falhar, cai num
// respondedor local com perguntas frequentes de RH/DP, só para o protótipo não
// ficar mudo.
//
// Escopo proposital: só assuntos de trabalho ligados a RH/DP (admissão,
// documentos, férias, desligamento, cadastro, benefícios, avaliação de
// desempenho, comunicação interna). Qualquer coisa fora disso — inclusive
// outras áreas da empresa (segurança do trabalho, operação de equipamentos
// etc.) ou assuntos pessoais/não relacionados a trabalho — recebe a recusa
// padrão abaixo, sempre educada e sem expor dados que a IA não tem.

import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const SUGESTOES = [
  "Como faço para solicitar férias?",
  "Quais documentos preciso entregar na admissão?",
  "Como funciona o aviso prévio no desligamento?",
  "Quando recebo o 13º salário?",
  "Como atualizo meus dados cadastrais?",
  "Como funciona a avaliação de desempenho?",
];

const RECUSA_FORA_DE_ESCOPO = "Não posso responder perguntas que não sejam relacionadas a trabalho!";

const FORA_DE_ESCOPO = [
  // outras áreas do sistema (não é RH/DP)
  "nr35",
  "nr 35",
  "nr-35",
  "aso",
  "içamento",
  "icamento",
  "guindaste",
  "operador",
  "epi",
  // assuntos pessoais / fora do contexto de trabalho
  "piada",
  "futebol",
  "filme",
  "música",
  "musica",
  "receita",
  "previsão do tempo",
  "previsao do tempo",
  "horóscopo",
  "horoscopo",
  "namorad",
];

const SAUDACOES = [
  "oi",
  "ola",
  "olá",
  "eae",
  "e ai",
  "e aí",
  "opa",
  "bom dia",
  "boa tarde",
  "boa noite",
  "tudo bem",
  "tudo bom",
  "hello",
  "hi",
];

const AGRADECIMENTOS = ["obrigado", "obrigada", "brigado", "brigada", "valeu", "vlw"];

function normalizar(q) {
  return q.replace(/[!?.,]+$/g, "").trim();
}

function responderLocal(pergunta, usuarioLogado) {
  const q = pergunta.toLowerCase();
  const limpo = normalizar(q);
  const nome = usuarioLogado?.nome ? `${usuarioLogado.nome}, ` : "";

  if (FORA_DE_ESCOPO.some((termo) => q.includes(termo))) {
    return RECUSA_FORA_DE_ESCOPO;
  }

  if (SAUDACOES.includes(limpo)) {
    return `Olá${usuarioLogado?.nome ? `, ${usuarioLogado.nome}` : ""}! Sou o Max, a IA da Maxpesa. Posso ajudar com férias, admissão, desligamento, documentos, cadastro, benefícios ou avaliação de desempenho — o que você precisa?`;
  }

  if (AGRADECIMENTOS.includes(limpo)) {
    return "De nada! Qualquer outra dúvida de RH/DP, é só perguntar.";
  }

  if (q.includes("férias") || q.includes("ferias")) {
    return `${nome}para solicitar férias, use a tela "Gestão de Férias" — lá dá pra ver seu saldo disponível e abrir a solicitação de período. O RH aprova e o status fica visível na mesma tela.`;
  }

  if (q.includes("admiss")) {
    return `${nome}os documentos e etapas da admissão ficam no módulo "Admissão Digital", que é aberto automaticamente quando uma contratação é aprovada no Recrutamento. Cada admissão tem um checklist de documentos pendentes.`;
  }

  if (q.includes("desligamento") || q.includes("aviso prévio") || q.includes("aviso previo") || q.includes("demiss")) {
    return `${nome}o processo de desligamento começa no "Desligamento Digital", aberto quando o RH desliga um colaborador ativo no Cadastro de Colaboradores. Lá ficam os documentos, prazos e o checklist do desligamento.`;
  }

  if (q.includes("13") || q.includes("décimo terceiro") || q.includes("decimo terceiro")) {
    return `${nome}o 13º salário segue o calendário legal: geralmente 1ª parcela até 30/11 e 2ª parcela até 20/12. Para valores e datas exatas da sua folha, confirme com o RH ou no holerite.`;
  }

  if (q.includes("cadastr") || q.includes("dados pessoais") || q.includes("dependente")) {
    return `${nome}dados cadastrais e dependentes são atualizados na tela "Cadastro de Colaboradores" (ou pelo Portal do Colaborador, se seu perfil tiver acesso). Qualquer divergência, procure o RH para corrigir.`;
  }

  if (q.includes("avalia") && (q.includes("desempenho") || q.includes("performance"))) {
    return `${nome}a Avaliação de Desempenho é feita por período/ciclo, com nota lançada pelo gestor. Você pode acompanhar o histórico e a nota geral na tela "Avaliação de Desempenho".`;
  }

  if (q.includes("documento")) {
    return `${nome}os documentos de cada colaborador ficam organizados na aba "Documentos", dentro do Cadastro de Colaboradores — é lá que o RH sobe e acompanha o que falta entregar.`;
  }

  if (q.includes("comunica") || q.includes("aniversari")) {
    return `${nome}avisos, comunicados e aniversariantes do mês aparecem no mural da "Comunicação Interna".`;
  }

  if (q.includes("benefíc") || q.includes("beneficio") || q.includes("vale")) {
    return `${nome}para dúvidas sobre benefícios (vale-transporte, vale-refeição, plano de saúde etc.), o RH é quem confirma valores e regras específicas do seu contrato — essa tela ainda não centraliza esses dados.`;
  }

  return `${nome}ainda não tenho uma resposta pronta para essa pergunta no modo local (sem a API do Max conectada). Para dados específicos e exatos, procure o RH — não posso informar nada que não esteja confirmado.`;
}

export async function responder(pergunta, usuarioLogado, historico = []) {
  if (!isSupabaseConfigured) {
    return responderLocal(pergunta, usuarioLogado);
  }

  try {
    const { data, error } = await supabase.functions.invoke("ia-corporativa", {
      body: {
        pergunta,
        usuario: usuarioLogado
          ? { nome: usuarioLogado.nome, role: usuarioLogado.role, filial: usuarioLogado.filial }
          : null,
        historico,
      },
    });

    if (error || !data?.resposta) {
      throw error ?? new Error(data?.erro ?? "Resposta vazia da IA Corporativa.");
    }

    return data.resposta;
  } catch {
    return responderLocal(pergunta, usuarioLogado);
  }
}
