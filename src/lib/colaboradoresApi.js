import { supabase } from "./supabaseClient";

// Converte o formato usado pelos formulários (camelCase, campos "nrs"/"certificacoes"
// como string separada por vírgula) para as colunas da tabela rh_colaboradores.
function paraLinha(dados) {
  return {
    nome: dados.nome,
    codigo_dominio: dados.codigoDominio || null,
    foto_url: dados.foto || null,
    cargo: dados.cargo || null,
    departamento: dados.departamento,
    filial: dados.filial || null,
    centro_custo: dados.centroCusto || null,
    gestor: dados.gestor || null,
    equipe: dados.equipe || null,
    admissao: dados.admissao || null,
    escolaridade: dados.escolaridade || null,
    dependentes: Number(dados.dependentes) || 0,
    cnh_categoria: dados.cnhCategoria || null,
    cnh_validade: dados.cnhValidade || null,
    nrs: dados.nrs ? String(dados.nrs).split(",").map((s) => s.trim()).filter(Boolean) : [],
    certificacoes: dados.certificacoes
      ? String(dados.certificacoes).split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    equipamentos: dados.equipamentos
      ? String(dados.equipamentos).split(",").map((s) => s.trim()).filter(Boolean)
      : [],
  };
}

// Converte uma linha da tabela de volta para o formato usado pelas telas.
function paraColaborador(row) {
  return {
    id: row.matricula,
    nome: row.nome,
    codigoDominio: row.codigo_dominio,
    foto: row.foto_url,
    cargo: row.cargo,
    departamento: row.departamento,
    filial: row.filial,
    centroCusto: row.centro_custo,
    gestor: row.gestor,
    equipe: row.equipe,
    admissao: row.admissao,
    escolaridade: row.escolaridade,
    dependentes: row.dependentes,
    cnh: row.cnh_categoria ? { categoria: row.cnh_categoria, validade: row.cnh_validade } : null,
    nrs: row.nrs ?? [],
    certificacoes: row.certificacoes ?? [],
    equipamentos: row.equipamentos ?? [],
    status: row.status,
  };
}

export async function listarColaboradores() {
  const { data, error } = await supabase
    .from("rh_colaboradores")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(paraColaborador);
}

export async function criarColaborador(dados) {
  const { data, error } = await supabase
    .from("rh_colaboradores")
    .insert(paraLinha(dados))
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraColaborador(data);
}

export async function atualizarColaborador(matricula, dados) {
  const { data, error } = await supabase
    .from("rh_colaboradores")
    .update(paraLinha(dados))
    .eq("matricula", matricula)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraColaborador(data);
}

export async function atualizarStatusColaborador(matricula, status) {
  const { data, error } = await supabase
    .from("rh_colaboradores")
    .update({ status })
    .eq("matricula", matricula)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraColaborador(data);
}

export async function excluirColaborador(matricula) {
  const { error } = await supabase.from("rh_colaboradores").delete().eq("matricula", matricula);
  if (error) throw new Error(error.message);
}

export async function importarColaboradores(linhas) {
  const { data, error } = await supabase
    .from("rh_colaboradores")
    .insert(linhas.map(paraLinha))
    .select();
  if (error) throw new Error(error.message);
  return data.map(paraColaborador);
}
