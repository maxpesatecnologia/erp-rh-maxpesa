import { supabase } from "./supabaseClient";
import { registrarAuditoria } from "./auditoriaApi";

const BUCKET = "rh-curriculos";
// Espelha o limite configurado no bucket (Storage) — ver migração
// rh_curriculos_bucket_limites.
export const TAMANHO_MAXIMO_CURRICULO = 50 * 1024 * 1024; // 50 MB

const TABELA_PASTAS = "rh_pastas_cargos";
const TABELA_CURRICULOS = "rh_curriculos";

// Timestamp + nome de quem fez a ação, gravados direto na linha (além do log
// em rh_auditoria) — é o que alimenta o UltimaEdicaoBadge sem precisar juntar
// com a tabela de auditoria toda vez que uma lista é carregada.
function carimboEdicao(usuario) {
  return { atualizado_por: usuario?.nome ?? null, atualizado_em: new Date().toISOString() };
}

// Nunca deve derrubar a ação principal (importar currículo etc.) — se o log
// de auditoria falhar, só avisa no console.
async function auditar(args) {
  try {
    await registrarAuditoria(args);
  } catch (e) {
    console.warn("Falha ao registrar auditoria:", e.message);
  }
}

// O Storage do Supabase rejeita chaves com acento, espaço e outros caracteres
// especiais ("Invalid key") — sanitiza mantendo o nome original só para exibição.
function sanitizarNomeArquivo(nomeOriginal) {
  const semAcento = nomeOriginal.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return semAcento.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

// Converte a linha da pasta (com os currículos aninhados via join) para o
// formato usado pela tela: { id, cargo, curriculos: [...] }.
function paraPasta(row) {
  return {
    id: row.id,
    cargo: row.cargo,
    atualizadoPor: row.atualizado_por || null,
    atualizadoEm: row.atualizado_em || null,
    curriculos: (row.curriculos ?? [])
      .map(paraCurriculo)
      .sort((a, b) => (a.enviadoEm < b.enviadoEm ? 1 : -1)),
  };
}

function paraCurriculo(row) {
  return {
    id: row.id,
    pastaId: row.pasta_id,
    nome: row.nome,
    arquivoNome: row.arquivo_nome,
    arquivoPath: row.arquivo_path,
    origem: row.origem,
    enviadoEm: row.enviado_em,
    atualizadoPor: row.atualizado_por || null,
    atualizadoEm: row.atualizado_em || null,
  };
}

export async function listarPastas() {
  const { data, error } = await supabase
    .from("rh_pastas_cargos")
    .select(
      "id, cargo, atualizado_por, atualizado_em, curriculos:rh_curriculos(id, pasta_id, nome, arquivo_nome, arquivo_path, origem, enviado_em, atualizado_por, atualizado_em)"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(paraPasta);
}

export async function criarPasta(cargo, usuario) {
  const { data, error } = await supabase
    .from("rh_pastas_cargos")
    .insert({ cargo, ...carimboEdicao(usuario) })
    .select("id, cargo, atualizado_por, atualizado_em")
    .single();
  if (error) throw new Error(error.message);
  const pasta = paraPasta({ ...data, curriculos: [] });
  await auditar({
    tabela: TABELA_PASTAS,
    registroId: pasta.id,
    registroLabel: pasta.cargo,
    acao: "criacao",
    usuario,
    depois: { cargo },
  });
  return pasta;
}

export async function excluirPasta(pastaId, usuario, cargoLabel) {
  const { data: arquivos, error: erroListagem } = await supabase.storage.from(BUCKET).list(pastaId);
  if (erroListagem) throw new Error(erroListagem.message);
  if (arquivos?.length) {
    const caminhos = arquivos.map((arquivo) => `${pastaId}/${arquivo.name}`);
    const { error: erroRemocao } = await supabase.storage.from(BUCKET).remove(caminhos);
    if (erroRemocao) throw new Error(erroRemocao.message);
  }
  const { error } = await supabase.from("rh_pastas_cargos").delete().eq("id", pastaId);
  if (error) throw new Error(error.message);
  await auditar({
    tabela: TABELA_PASTAS,
    registroId: pastaId,
    registroLabel: cargoLabel,
    acao: "exclusao",
    usuario,
  });
}

// Envia os arquivos para o Storage e grava os metadados na tabela — usado pela
// importação manual de currículos dentro de uma pasta de cargo. Registra uma
// única entrada de auditoria por chamada (não uma por arquivo).
export async function importarCurriculos(pastaId, arquivos, usuario) {
  const grandeDemais = arquivos.find((arquivo) => arquivo.size > TAMANHO_MAXIMO_CURRICULO);
  if (grandeDemais) {
    throw new Error(`"${grandeDemais.name}" passa do limite de 50 MB por currículo.`);
  }

  const carimbo = carimboEdicao(usuario);
  const linhas = [];
  for (const arquivo of arquivos) {
    const nomeSanitizado = sanitizarNomeArquivo(arquivo.name);
    const caminho = `${pastaId}/${crypto.randomUUID()}-${nomeSanitizado}`;
    const { error: erroUpload } = await supabase.storage.from(BUCKET).upload(caminho, arquivo);
    if (erroUpload) throw new Error(erroUpload.message);
    linhas.push({
      pasta_id: pastaId,
      nome: arquivo.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
      arquivo_nome: arquivo.name,
      arquivo_path: caminho,
      origem: "Upload manual",
      ...carimbo,
    });
  }
  const { data, error } = await supabase.from("rh_curriculos").insert(linhas).select();
  if (error) throw new Error(error.message);
  const curriculos = data.map(paraCurriculo);
  await auditar({
    tabela: TABELA_CURRICULOS,
    registroId: pastaId,
    registroLabel: `Importação de ${curriculos.length} currículo(s)`,
    acao: "criacao",
    usuario,
    depois: { quantidade: curriculos.length },
  });
  return curriculos;
}

export async function removerCurriculo(curriculo, usuario) {
  const { error: erroRemocao } = await supabase.storage.from(BUCKET).remove([curriculo.arquivoPath]);
  if (erroRemocao) throw new Error(erroRemocao.message);
  const { error } = await supabase.from("rh_curriculos").delete().eq("id", curriculo.id);
  if (error) throw new Error(error.message);
  await auditar({
    tabela: TABELA_CURRICULOS,
    registroId: curriculo.id,
    registroLabel: curriculo.nome,
    acao: "exclusao",
    usuario,
  });
}

// Gera uma URL temporária (1 min) para abrir/baixar o arquivo do currículo,
// já que o bucket é privado.
export async function obterUrlCurriculo(curriculo) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(curriculo.arquivoPath, 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
