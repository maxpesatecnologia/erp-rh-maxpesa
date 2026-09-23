import { supabase } from "./supabaseClient";
import { registrarAuditoria } from "./auditoriaApi";

const TABELA = "rh_colaboradores";

// Timestamp + nome de quem fez a ação, gravados direto na linha (além do log
// em rh_auditoria) — é o que alimenta o UltimaEdicaoBadge sem precisar juntar
// com a tabela de auditoria toda vez que uma lista é carregada.
function carimboEdicao(usuario) {
  return { atualizado_por: usuario?.nome ?? null, atualizado_em: new Date().toISOString() };
}

// Nunca deve derrubar a ação principal (salvar colaborador etc.) — se o log de
// auditoria falhar, só avisa no console.
async function auditar(args) {
  try {
    await registrarAuditoria(args);
  } catch (e) {
    console.warn("Falha ao registrar auditoria:", e.message);
  }
}

function paraLista(valor) {
  return valor ? String(valor).split(",").map((s) => s.trim()).filter(Boolean) : [];
}

// Cada campo do formulário (camelCase) e como gravá-lo na coluna da tabela
// rh_colaboradores. Usado tanto por paraLinha (grava tudo, com default sensato
// pro que não veio) quanto por paraLinhaParcial (grava só o que veio definido —
// ver import por planilha, que só deve sobrescrever campo com valor presente).
const CAMPOS_MAPEAVEIS = [
  ["nome", "nome", (v) => v],
  ["codigoDominio", "codigo_dominio", (v) => v || null],
  ["foto", "foto_url", (v) => v || null],
  ["cpf", "cpf", (v) => v || null],
  ["celular", "celular", (v) => v || null],
  ["email", "email", (v) => v || null],
  ["dataNascimento", "data_nascimento", (v) => v || null],
  ["cargo", "cargo", (v) => v || null],
  ["departamento", "departamento", (v) => v],
  ["filial", "filial", (v) => v || null],
  ["centroCusto", "centro_custo", (v) => v || null],
  ["gestor", "gestor", (v) => v || null],
  ["admissao", "admissao", (v) => v || null],
  ["salario", "salario", (v) => Number(v) || 0],
  ["status", "status", (v) => v || "Ativo"],
  // dependentes é sempre a contagem de dependentes_nomes preenchidos — calculada
  // antes de chegar aqui (NovoColaboradorForm/ImportarColaboradoresForm), nunca
  // digitada solta.
  ["dependentes", "dependentes", (v) => Number(v) || 0],
  ["dependentesNomes", "dependentes_nomes", (v) => v ?? []],
  ["cnhNumero", "cnh_numero", (v) => v || null],
  ["cnhCategoria", "cnh_categoria", (v) => v || null],
  ["cnhValidade", "cnh_validade", (v) => v || null],
  ["nrs", "nrs", paraLista],
  ["certificacoes", "certificacoes", paraLista],
  ["equipamentos", "equipamentos", paraLista],
  // Só entra no payload quando informado explicitamente (ex.: novo colaborador
  // vindo da Admissão Digital com os documentos já anexados por lá) — assim um
  // "Editar" comum, que não lida com documentos, não corre o risco de zerar a coluna.
  ["documentos", "documentos", (v) => v],
];

// Converte o formato usado pelos formulários (camelCase, campos "nrs"/"certificacoes"
// como string separada por vírgula) para as colunas da tabela rh_colaboradores.
// Grava todos os campos — os que não vieram em `dados` caem no default de cada
// transformação (ex.: salario vira 0, listas viram []). Usado por cadastro/edição
// manual e pela importação em massa de colaboradores completos.
function paraLinha(dados) {
  const linha = {};
  for (const [campo, coluna, transformar] of CAMPOS_MAPEAVEIS) {
    if (campo === "documentos" && dados.documentos === undefined) continue;
    linha[coluna] = transformar(dados[campo]);
  }
  return linha;
}

// Como paraLinha, mas só inclui as colunas cujo campo está presente em `dados`
// (ainda que `undefined` explícito não conte) — as demais colunas da tabela não
// são tocadas. Usado pela importação em planilha para atualizar um colaborador
// existente (por CPF) sem apagar os campos que a planilha não trouxe.
function paraLinhaParcial(dados) {
  const linha = {};
  for (const [campo, coluna, transformar] of CAMPOS_MAPEAVEIS) {
    if (dados[campo] === undefined) continue;
    linha[coluna] = transformar(dados[campo]);
  }
  return linha;
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
    dataNascimento: row.data_nascimento,
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
    atualizadoPor: row.atualizado_por || null,
    atualizadoEm: row.atualizado_em || null,
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

export async function criarColaborador(dados, usuario) {
  const { data, error } = await supabase
    .from("rh_colaboradores")
    .insert({ ...paraLinha(dados), ...carimboEdicao(usuario) })
    .select()
    .single();
  if (error) throw new Error(error.message);
  const colaborador = paraColaborador(data);
  await auditar({
    tabela: TABELA,
    registroId: colaborador.id,
    registroLabel: colaborador.nome,
    acao: "criacao",
    usuario,
    depois: dados,
  });
  return colaborador;
}

export async function atualizarColaborador(matricula, dados, usuario, dadosAnteriores) {
  const { data, error } = await supabase
    .from("rh_colaboradores")
    .update({ ...paraLinha(dados), ...carimboEdicao(usuario) })
    .eq("matricula", matricula)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const colaborador = paraColaborador(data);
  await auditar({
    tabela: TABELA,
    registroId: matricula,
    registroLabel: colaborador.nome,
    acao: "edicao",
    usuario,
    antes: dadosAnteriores,
    depois: dados,
  });
  return colaborador;
}

export async function atualizarStatusColaborador(matricula, status, usuario) {
  const { data, error } = await supabase
    .from("rh_colaboradores")
    .update({ status, ...carimboEdicao(usuario) })
    .eq("matricula", matricula)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const colaborador = paraColaborador(data);
  await auditar({
    tabela: TABELA,
    registroId: matricula,
    registroLabel: colaborador.nome,
    acao: "edicao",
    usuario,
    depois: { status },
  });
  return colaborador;
}

// Atualiza só a coluna de documentos — usado pela aba Documentos, sem passar
// pelo resto do cadastro (que não deve ser tocado ao anexar um arquivo).
// `documentosAnterior` é opcional mas quem chama sempre tem ele à mão (estado
// antes do anexo/remoção) — sem ele o histórico só registra "documentos:
// atualizado", sem dizer qual documento mudou.
export async function atualizarDocumentosColaborador(matricula, documentos, usuario, documentosAnterior) {
  const { data, error } = await supabase
    .from("rh_colaboradores")
    .update({ documentos, ...carimboEdicao(usuario) })
    .eq("matricula", matricula)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const colaborador = paraColaborador(data);
  await auditar({
    tabela: TABELA,
    registroId: matricula,
    registroLabel: colaborador.nome,
    acao: "edicao",
    usuario,
    antes: documentosAnterior !== undefined ? { documentos: documentosAnterior } : undefined,
    depois: { documentos },
  });
  return colaborador;
}

// Atualiza só o ajuste manual de saldo de férias — usado pela Gestão de Férias,
// sem passar pelo resto do cadastro. Ver README ("ajuste manual de saldo").
export async function atualizarAjusteFeriasColaborador(matricula, ajusteDias, ajusteMotivo, historicoOk, usuario) {
  const { data, error } = await supabase
    .from("rh_colaboradores")
    .update({
      ferias_ajuste_dias: Number(ajusteDias) || 0,
      ferias_ajuste_motivo: ajusteMotivo || null,
      ferias_historico_ok: Boolean(historicoOk),
      ...carimboEdicao(usuario),
    })
    .eq("matricula", matricula)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const colaborador = paraColaborador(data);
  await auditar({
    tabela: TABELA,
    registroId: matricula,
    registroLabel: colaborador.nome,
    acao: "edicao",
    usuario,
    depois: { ferias_ajuste_dias: ajusteDias, ferias_ajuste_motivo: ajusteMotivo, ferias_historico_ok: historicoOk },
  });
  return colaborador;
}

export async function excluirColaborador(matricula, usuario, nomeColaborador) {
  const { error } = await supabase.from("rh_colaboradores").delete().eq("matricula", matricula);
  if (error) throw new Error(error.message);
  await auditar({
    tabela: TABELA,
    registroId: matricula,
    registroLabel: nomeColaborador,
    acao: "exclusao",
    usuario,
  });
}

export async function excluirTodosColaboradores(usuario) {
  const { error } = await supabase.from("rh_colaboradores").delete().neq("matricula", "");
  if (error) throw new Error(error.message);
  await auditar({
    tabela: TABELA,
    registroId: "todos",
    registroLabel: "Todos os colaboradores",
    acao: "exclusao",
    usuario,
  });
}

export async function importarColaboradores(linhas, usuario) {
  const carimbo = carimboEdicao(usuario);
  const { data, error } = await supabase
    .from("rh_colaboradores")
    .insert(linhas.map((linha) => ({ ...paraLinha(linha), ...carimbo })))
    .select();
  if (error) throw new Error(error.message);
  const colaboradores = data.map(paraColaborador);
  await auditar({
    tabela: TABELA,
    registroId: "importacao",
    registroLabel: `Importação de ${colaboradores.length} colaborador(es)`,
    acao: "criacao",
    usuario,
    depois: { quantidade: colaboradores.length },
  });
  return colaboradores;
}

// Atualização parcial usada pela importação em planilha ao encontrar o CPF de
// um colaborador já cadastrado: só grava as colunas presentes em `dados` — o
// resto do cadastro existente não é tocado (nunca zera campo por ausência).
export async function atualizarColaboradorParcial(matricula, dados, usuario) {
  const linha = { ...paraLinhaParcial(dados), ...carimboEdicao(usuario) };
  if (Object.keys(linha).length === 0) return null;
  const { data, error } = await supabase
    .from("rh_colaboradores")
    .update(linha)
    .eq("matricula", matricula)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const colaborador = paraColaborador(data);
  await auditar({
    tabela: TABELA,
    registroId: matricula,
    registroLabel: colaborador.nome,
    acao: "edicao",
    usuario,
    depois: dados,
  });
  return colaborador;
}
