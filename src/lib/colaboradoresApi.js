import { supabase } from "./supabaseClient";

// Converte o formato usado pelos formulários (camelCase, campos "nrs"/"certificacoes"
// como string separada por vírgula) para as colunas da tabela rh_colaboradores.
function paraLinha(dados) {
  return {
    nome: dados.nome,
    codigo_dominio: dados.codigoDominio || null,
    foto_url: dados.foto || null,
    cpf: dados.cpf || null,
    celular: dados.celular || null,
    email: dados.email || null,
    cargo: dados.cargo || null,
    departamento: dados.departamento,
    filial: dados.filial || null,
    centro_custo: dados.centroCusto || null,
    gestor: dados.gestor || null,
    admissao: dados.admissao || null,
    salario: Number(dados.salario) || 0,
    status: dados.status || "Ativo",
    // dependentes é sempre a contagem de dependentes_nomes preenchidos — calculada
    // em NovoColaboradorForm.jsx antes de chegar aqui, nunca digitada solta.
    dependentes: Number(dados.dependentes) || 0,
    dependentes_nomes: dados.dependentesNomes ?? [],
    cnh_numero: dados.cnhNumero || null,
    cnh_categoria: dados.cnhCategoria || null,
    cnh_validade: dados.cnhValidade || null,
    nrs: dados.nrs ? String(dados.nrs).split(",").map((s) => s.trim()).filter(Boolean) : [],
    certificacoes: dados.certificacoes
      ? String(dados.certificacoes).split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    equipamentos: dados.equipamentos
      ? String(dados.equipamentos).split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    // Só entra no payload quando informado explicitamente (ex.: novo colaborador
    // vindo da Admissão Digital com os documentos já anexados por lá) — assim um
    // "Editar" comum, que não lida com documentos, não corre o risco de zerar a coluna.
    ...(dados.documentos !== undefined ? { documentos: dados.documentos } : {}),
  };
}

// Converte uma linha da tabela de volta para o formato usado pelas telas.
function paraColaborador(row) {
  return {
    id: row.matricula,
    nome: row.nome,
    codigoDominio: row.codigo_dominio,
    foto: row.foto_url,
    cpf: row.cpf,
    celular: row.celular,
    email: row.email,
    cargo: row.cargo,
    departamento: row.departamento,
    filial: row.filial,
    centroCusto: row.centro_custo,
    gestor: row.gestor,
    admissao: row.admissao,
    salario: row.salario,
    dependentes: row.dependentes,
    dependentesNomes: row.dependentes_nomes ?? [],
    cnh: row.cnh_categoria || row.cnh_numero || row.cnh_validade
      ? { numero: row.cnh_numero, categoria: row.cnh_categoria, validade: row.cnh_validade }
      : null,
    nrs: row.nrs ?? [],
    certificacoes: row.certificacoes ?? [],
    equipamentos: row.equipamentos ?? [],
    status: row.status,
    // `anexos`: mapa chave -> arquivo anexado (documentos obrigatórios + extras).
    // `extras`: documentos extras criados manualmente pelo RH na aba Documentos.
    // Colaboradores cadastrados antes desta coluna existir chegam vazios — a aba
    // Documentos permite anexar/criar a partir de agora.
    documentos: { anexos: {}, extras: [], ...(row.documentos || {}) },
    // Ajuste manual de saldo de férias (RH) — ver README ("ajuste manual de saldo").
    // Soma aos dias usados calculados automaticamente; existe pra cobrir gente que já
    // está de férias ou já tirou dias antes deste módulo existir.
    feriasAjusteDias: row.ferias_ajuste_dias ?? 0,
    feriasAjusteMotivo: row.ferias_ajuste_motivo || "",
    // Zera o histórico de períodos anteriores no cálculo de férias vencidas — pra
    // colaborador antigo que tirou férias normalmente antes deste sistema existir,
    // mas não tem nenhuma solicitação lançada aqui pra provar isso.
    feriasHistoricoOk: row.ferias_historico_ok ?? false,
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

// Atualiza só a coluna de documentos — usado pela aba Documentos, sem passar
// pelo resto do cadastro (que não deve ser tocado ao anexar um arquivo).
export async function atualizarDocumentosColaborador(matricula, documentos) {
  const { data, error } = await supabase
    .from("rh_colaboradores")
    .update({ documentos })
    .eq("matricula", matricula)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return paraColaborador(data);
}

// Atualiza só o ajuste manual de saldo de férias — usado pela Gestão de Férias,
// sem passar pelo resto do cadastro. Ver README ("ajuste manual de saldo").
export async function atualizarAjusteFeriasColaborador(matricula, ajusteDias, ajusteMotivo, historicoOk) {
  const { data, error } = await supabase
    .from("rh_colaboradores")
    .update({
      ferias_ajuste_dias: Number(ajusteDias) || 0,
      ferias_ajuste_motivo: ajusteMotivo || null,
      ferias_historico_ok: Boolean(historicoOk),
    })
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

export async function excluirTodosColaboradores() {
  const { error } = await supabase.from("rh_colaboradores").delete().neq("matricula", "");
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
