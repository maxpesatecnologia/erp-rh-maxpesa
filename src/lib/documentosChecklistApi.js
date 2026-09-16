import { supabase, isSupabaseConfigured } from "./supabaseClient";

// Bucket compartilhado pelos anexos obrigatórios dos checklists de Admissão e
// Desligamento (ex.: documentos pessoais, via de confirmação de devolução de
// EPIs, exame demissional, acerto rescisório). Precisa existir no Storage do
// Supabase — criar manualmente caso ainda não exista.
const BUCKET = "rh-checklist-docs";

// O Storage do Supabase rejeita chaves com acento, espaço e outros caracteres
// especiais ("Invalid key") — sanitiza mantendo o nome original só para exibição.
function sanitizarNomeArquivo(nomeOriginal) {
  const semAcento = nomeOriginal.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return semAcento.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

// Envia o anexo para o Storage e devolve os metadados a gravar no checklist.
// Sem Supabase configurado (modo demo), guarda só o nome do arquivo — não há
// backend para persistir o binário.
export async function anexarDocumentoChecklist(prefixo, arquivo) {
  if (!isSupabaseConfigured) {
    return { nome: arquivo.name, path: null };
  }
  const nomeSanitizado = sanitizarNomeArquivo(arquivo.name);
  const caminho = `${prefixo}/${crypto.randomUUID()}-${nomeSanitizado}`;
  const { error } = await supabase.storage.from(BUCKET).upload(caminho, arquivo);
  if (error) throw new Error(error.message);
  return { nome: arquivo.name, path: caminho };
}

export async function removerDocumentoChecklist(path) {
  if (!isSupabaseConfigured || !path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

// Gera uma URL temporária (1 min) para abrir/baixar o anexo, já que o bucket é privado.
export async function obterUrlDocumentoChecklist(path) {
  if (!isSupabaseConfigured || !path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
