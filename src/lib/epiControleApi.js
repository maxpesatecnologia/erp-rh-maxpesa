// Integração com a MAXPESA API (Controle de EPI & EPC — doc: MAXPESA-API.md).
//
// A chamada real acontece na Edge Function `epi-controle` (ver
// supabase/functions/epi-controle/index.ts), que guarda a chave da API como
// secret do projeto Supabase. Aqui no front nunca existe nenhuma credencial —
// só invocamos a function, do mesmo jeito que src/lib/iaCorporativa.js faz
// com a `ia-corporativa`.
//
// A API externa devolve dados "crus" por recurso (colaboradores, equipamentos,
// entregas, devolucoes, asos...). É aqui que cruzamos esses recursos para
// montar o formato que as telas "EPIs por Colaborador" e "Controle de ASO"
// esperam (mesmo formato dos dados de exemplo em
// src/data/mock/epiControleExterno.js).
//
// Sem Supabase configurado, caímos nos dados de exemplo (mock) para a tela
// funcionar de ponta a ponta no protótipo.

import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { ASOS_EXTERNOS, COLABORADORES_EPI } from "../data/mock/epiControleExterno";

export const epiControleConfigured = isSupabaseConfigured;

function comDados(dados) {
  return new Promise((resolve) => setTimeout(() => resolve(dados), 500));
}

// A doc da MAXPESA API não detalha os nomes exatos dos campos de cada
// recurso — só a forma da resposta paginada. `pick` tenta, em ordem, cada
// nome de campo possível, para o mapeamento não quebrar se o nome real for
// diferente do que assumimos aqui.
function pick(obj, ...chaves) {
  for (const chave of chaves) {
    const valor = obj?.[chave];
    if (valor !== undefined && valor !== null && valor !== "") return valor;
  }
  return undefined;
}

const LIMITE_PAGINA = 500;
const MAX_PAGINAS = 20; // trava de segurança: até 10.000 registros por recurso

// O ASO vem com `anexo_url` como caminho relativo dentro de um bucket do
// storage do MAXPESA Controle (ex.: "asos/169-arquivo.pdf"), não como link
// completo — e a doc não informa o nome do bucket nem se ele é público.
// Sem essa informação, não dá pra montar um link confiável: em vez de gerar
// uma URL que pode voltar 404, só repassamos caminhos que já vierem prontos
// (http/https). Quando o MAXPESA Controle confirmar o bucket, é só completar
// esta função.
function resolverAnexoUrl(caminho) {
  if (!caminho) return null;
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return null;
}

async function buscarPagina(recurso, offset) {
  const { data, error } = await supabase.functions.invoke("epi-controle", {
    body: { recurso, params: { limit: LIMITE_PAGINA, offset } },
  });
  if (error || data?.erro) {
    throw new Error(data?.erro || error?.message || `Falha ao consultar "${recurso}" no EPI Controle.`);
  }
  return data;
}

async function buscarTudo(recurso) {
  const itens = [];
  let offset = 0;
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const resposta = await buscarPagina(recurso, offset);
    const lote = Array.isArray(resposta?.data) ? resposta.data : [];
    itens.push(...lote);
    if (!resposta?.pagination?.has_more) break;
    offset += LIMITE_PAGINA;
  }
  return itens;
}

export async function listarAsosExternos() {
  if (!epiControleConfigured) return comDados(ASOS_EXTERNOS);

  const [asos, colaboradores] = await Promise.all([buscarTudo("asos"), buscarTudo("colaboradores")]);
  const colaboradorPorId = new Map(colaboradores.map((c) => [c.id, c]));

  return asos.map((a) => {
    const aninhado = a.colaborador && typeof a.colaborador === "object" ? a.colaborador : null;
    const colaboradorId = pick(a, "colaborador_id", "colaboradorId");
    const colaborador = aninhado || colaboradorPorId.get(colaboradorId) || {};

    return {
      id: a.id,
      colaborador: (pick(a, "colaborador_nome") ?? pick(colaborador, "nome"))?.trim() || "—",
      empresa: pick(a, "empresa") ?? pick(colaborador, "empresa") ?? "—",
      setor: pick(a, "setor") ?? pick(colaborador, "setor") ?? "—",
      tipo: pick(a, "tipo", "tipo_exame") ?? "—",
      exame: pick(a, "exame", "data_exame"),
      vencimento: pick(a, "vencimento", "data_vencimento"),
      resultado: pick(a, "resultado") ?? "—",
      clinica: pick(a, "clinica", "clinica_nome") ?? "—",
      anexoUrl: resolverAnexoUrl(pick(a, "anexoUrl", "anexo_url", "arquivo_url")),
    };
  });
}

export async function listarEpisPorColaborador() {
  if (!epiControleConfigured) return comDados(COLABORADORES_EPI);

  const [colaboradores, equipamentos, entregas, devolucoes] = await Promise.all([
    buscarTudo("colaboradores"),
    buscarTudo("equipamentos"),
    buscarTudo("entregas"),
    buscarTudo("devolucoes"),
  ]);

  const equipamentoPorId = new Map(equipamentos.map((e) => [e.id, e]));
  const entregasDevolvidasIds = new Set(
    devolucoes.map((d) => pick(d, "entrega_id", "entregaId")).filter(Boolean)
  );

  // Cada entrega conta como 1 EPI, mesmo que seja do mesmo equipamento de uma
  // entrega anterior (reposição) — é assim que o MAXPESA Controle conta.
  const episPorColaboradorId = new Map();
  for (const entrega of entregas) {
    if (entregasDevolvidasIds.has(entrega.id)) continue; // já devolvido, não conta mais como EPI atual

    const colaboradorId = pick(entrega, "colaborador_id", "colaboradorId");
    if (!colaboradorId) continue;

    const aninhado = entrega.equipamento && typeof entrega.equipamento === "object" ? entrega.equipamento : null;
    const equipamentoId = pick(entrega, "equipamento_id", "equipamentoId");
    const equipamento = aninhado || equipamentoPorId.get(equipamentoId) || {};

    const lista = episPorColaboradorId.get(colaboradorId) || [];
    lista.push({
      nome: pick(equipamento, "nome") ?? "EPI",
      validade: pick(entrega, "validade", "data_validade", "data_vencimento"),
    });
    episPorColaboradorId.set(colaboradorId, lista);
  }

  return colaboradores
    .filter((c) => c.ativo !== false) // não mostra colaboradores já desligados
    .map((c) => ({
      id: c.id,
      nome: pick(c, "nome")?.trim() ?? "—",
      cargo: pick(c, "cargo", "funcao") ?? "—",
      setor: pick(c, "setor") ?? "—",
      empresa: pick(c, "empresa") ?? "—",
      epis: episPorColaboradorId.get(c.id) || [],
    }));
}
