import { supabase } from "./supabaseClient";

function paraCandidato(row) {
  return {
    id: row.id,
    nome: row.nome,
    vaga: row.vaga,
    origem: row.origem,
    estagioId: row.estagio_id,
    faseAtual: row.fase_atual,
  };
}

export async function listarCandidatos() {
  const { data, error } = await supabase
    .from("rh_candidatos")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data.map(paraCandidato);
}

export async function criarCandidato(dados) {
  const { data, error } = await supabase
    .from("rh_candidatos")
    .insert({ nome: dados.nome, vaga: dados.vaga || null, origem: dados.origem || null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraCandidato(data);
}

export async function moverCandidato(candidatoId, estagioId) {
  const { error } = await supabase.from("rh_candidatos").update({ estagio_id: estagioId }).eq("id", candidatoId);
  if (error) throw new Error(error.message);
}

export async function excluirCandidato(candidatoId) {
  const { error } = await supabase.from("rh_candidatos").delete().eq("id", candidatoId);
  if (error) throw new Error(error.message);
}

export async function atualizarCandidato(candidatoId, dados) {
  const { data, error } = await supabase
    .from("rh_candidatos")
    .update({
      nome: dados.nome,
      vaga: dados.vaga || null,
      origem: dados.origem || null,
      fase_atual: dados.faseAtual || null,
    })
    .eq("id", candidatoId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraCandidato(data);
}
