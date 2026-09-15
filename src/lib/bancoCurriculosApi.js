import { supabase } from "./supabaseClient";

const BUCKET = "rh-curriculos";
// Espelha o limite configurado no bucket (Storage) — ver migração
// rh_curriculos_bucket_limites.
export const TAMANHO_MAXIMO_CURRICULO = 50 * 1024 * 1024; // 50 MB

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
  };
}

export async function listarPastas() {
  const { data, error } = await supabase
    .from("rh_pastas_cargos")
    .select("id, cargo, curriculos:rh_curriculos(id, pasta_id, nome, arquivo_nome, arquivo_path, origem, enviado_em)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(paraPasta);
}

export async function criarPasta(cargo) {
  const { data, error } = await supabase
    .from("rh_pastas_cargos")
    .insert({ cargo })
    .select("id, cargo")
    .single();
  if (error) throw new Error(error.message);
  return paraPasta({ ...data, curriculos: [] });
}

export async function excluirPasta(pastaId) {
  const { data: arquivos, error: erroListagem } = await supabase.storage.from(BUCKET).list(pastaId);
  if (erroListagem) throw new Error(erroListagem.message);
  if (arquivos?.length) {
    const caminhos = arquivos.map((arquivo) => `${pastaId}/${arquivo.name}`);
    const { error: erroRemocao } = await supabase.storage.from(BUCKET).remove(caminhos);
    if (erroRemocao) throw new Error(erroRemocao.message);
  }
  const { error } = await supabase.from("rh_pastas_cargos").delete().eq("id", pastaId);
  if (error) throw new Error(error.message);
}

// Envia os arquivos para o Storage e grava os metadados na tabela — usado pela
// importação manual de currículos dentro de uma pasta de cargo.
export async function importarCurriculos(pastaId, arquivos) {
  const grandeDemais = arquivos.find((arquivo) => arquivo.size > TAMANHO_MAXIMO_CURRICULO);
  if (grandeDemais) {
    throw new Error(`"${grandeDemais.name}" passa do limite de 50 MB por currículo.`);
  }

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
    });
  }
  const { data, error } = await supabase.from("rh_curriculos").insert(linhas).select();
  if (error) throw new Error(error.message);
  return data.map(paraCurriculo);
}

export async function removerCurriculo(curriculo) {
  const { error: erroRemocao } = await supabase.storage.from(BUCKET).remove([curriculo.arquivoPath]);
  if (erroRemocao) throw new Error(erroRemocao.message);
  const { error } = await supabase.from("rh_curriculos").delete().eq("id", curriculo.id);
  if (error) throw new Error(error.message);
}

// Gera uma URL temporária (1 min) para abrir/baixar o arquivo do currículo,
// já que o bucket é privado.
export async function obterUrlCurriculo(curriculo) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(curriculo.arquivoPath, 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
