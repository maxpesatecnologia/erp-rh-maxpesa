import { useMemo, useState } from "react";
import { UploadCloud, Download } from "lucide-react";
import * as XLSX from "xlsx";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { CAMPOS_OBRIGATORIOS, cpfValido } from "./NovoColaboradorForm";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

function apenasDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

// "dependente1".."dependente6" são só um ponto de partida no modelo baixável —
// a importação aceita quantas colunas "dependenteN" o arquivo trouxer (dependente7,
// dependente8, ...), sem limite, já que uma pessoa pode ter mais de 6 dependentes.
const COLUNAS_MODELO = [
  "nome",
  "codigoDominio",
  "cpf",
  "celular",
  "email",
  "dataNascimento",
  "cargo",
  "departamento",
  "filial",
  "centroCusto",
  "gestor",
  "admissao",
  "dataDemissao",
  "salario",
  "dependente1",
  "dependente2",
  "dependente3",
  "dependente4",
  "dependente5",
  "dependente6",
  "cnhNumero",
  "cnhCategoria",
  "cnhValidade",
  "nrs",
  "certificacoes",
  "equipamentos",
];

// Normaliza nome de coluna pra comparar sem se importar com maiúscula/minúscula
// ou acento (ex.: "Admissão" e "Salario" batem com "admissao" e "salario").
function normalizarNomeColuna(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

// Casa "Dependente 1", "dependente_7", "DEPENDENTE12" etc. — qualquer número,
// não só os 6 listados no modelo baixável.
const REGEX_COLUNA_DEPENDENTE = /^dependente(\d+)$/;

// Troca os nomes do cabeçalho do arquivo pelos nomes canônicos usados no
// resto do sistema (ex.: "Admissão" vira "admissao"), quando reconhecidos.
// Colunas "dependenteN" além das 6 do modelo também são reconhecidas, pra não
// haver limite de dependentes por planilha.
function mapearCabecalho(cabecalho) {
  const porNomeNormalizado = new Map(
    COLUNAS_MODELO.map((campo) => [normalizarNomeColuna(campo), campo])
  );
  return cabecalho.map((coluna) => {
    const normalizado = normalizarNomeColuna(coluna);
    if (porNomeNormalizado.has(normalizado)) return porNomeNormalizado.get(normalizado);
    if (REGEX_COLUNA_DEPENDENTE.test(normalizado)) return normalizado;
    return coluna;
  });
}

// Junta as colunas "dependenteN" (em qualquer quantidade) da linha num único
// array `dependentesNomes`, na ordem, ignorando as vazias — mesmo formato usado
// pelo cadastro manual (NovoColaboradorForm). `dependentes` vira a contagem,
// calculada a partir da lista, nunca digitada solta na planilha.
function extrairDependentes(registro) {
  const nomes = Object.keys(registro)
    .map((chave) => {
      const match = chave.match(REGEX_COLUNA_DEPENDENTE);
      return match ? { indice: Number(match[1]), valor: String(registro[chave] ?? "").trim() } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.indice - b.indice)
    .map((d) => d.valor)
    .filter(Boolean);

  const resto = { ...registro };
  Object.keys(resto).forEach((chave) => {
    if (REGEX_COLUNA_DEPENDENTE.test(chave)) delete resto[chave];
  });

  return { ...resto, dependentesNomes: nomes, dependentes: nomes.length };
}

function detectarDelimitador(linhaCabecalho) {
  const pontoEVirgula = (linhaCabecalho.match(/;/g) || []).length;
  const virgula = (linhaCabecalho.match(/,/g) || []).length;
  return pontoEVirgula > virgula ? ";" : ",";
}

// Parser simples de uma linha CSV respeitando campos entre aspas (pra não
// quebrar quando um campo como "nrs" tiver vírgulas dentro, ex: "NR-35, NR-11").
function parseLinhaCSV(linha, delimitador) {
  const campos = [];
  let atual = "";
  let dentroDeAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];
    if (dentroDeAspas) {
      if (char === '"') {
        if (linha[i + 1] === '"') {
          atual += '"';
          i++;
        } else {
          dentroDeAspas = false;
        }
      } else {
        atual += char;
      }
    } else if (char === '"') {
      dentroDeAspas = true;
    } else if (char === delimitador) {
      campos.push(atual);
      atual = "";
    } else {
      atual += char;
    }
  }
  campos.push(atual);
  return campos.map((c) => c.trim());
}

const BOM = String.fromCharCode(0xfeff);

function parseCSV(texto) {
  const semBom = texto.startsWith(BOM) ? texto.slice(BOM.length) : texto;
  const linhas = semBom.split(/\r\n|\n/).filter((l) => l.trim() !== "");
  if (linhas.length === 0) return { cabecalho: [], linhas: [] };
  const delimitador = detectarDelimitador(linhas[0]);
  const cabecalho = mapearCabecalho(parseLinhaCSV(linhas[0], delimitador));
  const linhasDados = linhas.slice(1).map((linha) => {
    const valores = parseLinhaCSV(linha, delimitador);
    const registro = {};
    cabecalho.forEach((campo, i) => {
      registro[campo] = valores[i] ?? "";
    });
    return registro;
  });
  return { cabecalho, linhas: linhasDados };
}

// Monta {cabecalho, linhas} a partir de uma matriz de linhas (linha 0 = cabeçalho),
// formato comum entre o parser de CSV e o de planilhas Excel.
function linhasParaRegistros(matriz) {
  const linhas = matriz.filter((linha) => linha.some((c) => String(c ?? "").trim() !== ""));
  if (linhas.length === 0) return { cabecalho: [], linhas: [] };
  const cabecalho = mapearCabecalho(linhas[0].map((c) => String(c ?? "").trim()));
  const linhasDados = linhas.slice(1).map((linha) => {
    const registro = {};
    cabecalho.forEach((campo, i) => {
      registro[campo] = String(linha[i] ?? "").trim();
    });
    return registro;
  });
  return { cabecalho, linhas: linhasDados };
}

function formatarDataISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Extrai o texto de uma célula sem depender só do texto formatado em cache
// (célula.w): algumas planilhas (ex.: colunas com fórmula/VLOOKUP) chegam sem
// esse cache, então cai pro valor bruto (célula.v), formatando número/data
// manualmente quando possível.
function celulaParaTexto(cell) {
  if (!cell) return "";
  if (cell.t === "d" && cell.v instanceof Date) return formatarDataISO(cell.v);
  if (cell.w !== undefined && cell.w !== null && cell.w !== "") return String(cell.w).trim();
  if (cell.v === undefined || cell.v === null) return "";
  if (cell.t === "n" && cell.z && XLSX.SSF) {
    try {
      return String(XLSX.SSF.format(cell.z, cell.v)).trim();
    } catch {
      return String(cell.v).trim();
    }
  }
  return String(cell.v).trim();
}

// Colunas numéricas: usamos o valor bruto da célula (célula.v) em vez do
// texto formatado, porque colunas com fórmula (ex.: VLOOKUP de salário) não
// têm o texto formatado em cache — o fallback pra SSF.format monta o número
// com separadores no padrão americano (vírgula de milhar), o que ambiguava
// com o formato BR ao reinterpretar o texto depois (ex.: "R$ 3,000.00"
// virava 3 em vez de 3000). Pegando o número puro, essa ambiguidade não existe.
const CAMPOS_NUMERICOS = ["salario"];

function celulaParaValorNumerico(cell) {
  if (!cell) return "";
  if (cell.t === "n" && typeof cell.v === "number") return String(cell.v);
  return celulaParaTexto(cell);
}

// Lê a primeira planilha de um arquivo .xlsx/.xls célula a célula (em vez de
// usar sheet_to_json com raw:false), pra conseguir cair pro valor bruto quando
// o texto formatado não estiver em cache no arquivo.
function parseExcel(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  const primeiraAba = workbook.Sheets[workbook.SheetNames[0]];
  if (!primeiraAba["!ref"]) return { cabecalho: [], linhas: [] };
  const intervalo = XLSX.utils.decode_range(primeiraAba["!ref"]);

  const cabecalhoBruto = [];
  for (let coluna = intervalo.s.c; coluna <= intervalo.e.c; coluna++) {
    const endereco = XLSX.utils.encode_cell({ r: intervalo.s.r, c: coluna });
    cabecalhoBruto.push(celulaParaTexto(primeiraAba[endereco]));
  }
  const cabecalhoMapeado = mapearCabecalho(cabecalhoBruto);
  const indicesNumericos = new Set(
    cabecalhoMapeado.map((campo, i) => (CAMPOS_NUMERICOS.includes(campo) ? i : -1)).filter((i) => i >= 0)
  );

  const matriz = [cabecalhoBruto];
  for (let linha = intervalo.s.r + 1; linha <= intervalo.e.r; linha++) {
    const valoresLinha = [];
    for (let coluna = intervalo.s.c; coluna <= intervalo.e.c; coluna++) {
      const endereco = XLSX.utils.encode_cell({ r: linha, c: coluna });
      const cell = primeiraAba[endereco];
      const indiceRelativo = coluna - intervalo.s.c;
      valoresLinha.push(
        indicesNumericos.has(indiceRelativo) ? celulaParaValorNumerico(cell) : celulaParaTexto(cell)
      );
    }
    matriz.push(valoresLinha);
  }
  return linhasParaRegistros(matriz);
}

// Aceita valor monetário em formato BR (ex.: "R$ 3.000,00", "3.000,00") e
// também formato simples (ex.: "3000", "3000.50"), retornando string numérica
// pronta pra Number(). Remove símbolo de moeda e usa vírgula como decimal
// quando presente (nesse caso ponto é separador de milhar).
function normalizarValorMonetario(valor) {
  const texto = String(valor ?? "").trim();
  if (!texto) return "";
  let limpo = texto.replace(/[^\d.,-]/g, "");
  if (!limpo) return "";
  if (limpo.includes(",")) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(limpo)) {
    limpo = limpo.replace(/\./g, "");
  }
  return limpo;
}

// Aceita AAAA-MM-DD (padrão interno) e D/M/AAAA ou DD/MM/AAAA (comum em
// export de Excel BR). Valida o calendário (rejeita "31/02/2025" etc.) —
// datas inválidas nunca podem ir pro banco, senão o Postgres rejeita o
// insert inteiro com "date/time field value out of range".
function normalizarData(valor) {
  if (!valor) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split("-").map(Number);
    return dataValida(ano, mes, dia) ? valor : null;
  }
  const match = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, d, m, a] = match;
    if (!dataValida(Number(a), Number(m), Number(d))) return null;
    return `${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

function dataValida(ano, mes, dia) {
  if (!Number.isInteger(ano) || !Number.isInteger(mes) || !Number.isInteger(dia)) return false;
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return false;
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

// Campos de texto simples que, no modo "atualizar", só entram no payload
// quando a célula tem valor — célula em branco nunca apaga o que já está
// cadastrado, só é ignorada.
const CAMPOS_TEXTO_SIMPLES_PARCIAL = [
  "nome",
  "codigoDominio",
  "cpf",
  "celular",
  "email",
  "cargo",
  "departamento",
  "filial",
  "centroCusto",
  "gestor",
  "cnhNumero",
  "cnhCategoria",
  "nrs",
  "certificacoes",
  "equipamentos",
];

// Monta o payload do modo "atualizar-parcial": só os campos com valor de fato
// presente na linha (texto não vazio, data válida, dependentes informados).
// Tudo que a planilha deixou em branco fica de fora — e por ficar de fora,
// atualizarColaboradorParcial não toca na coluna correspondente no banco.
function construirDadosParciais(registro, normalizados) {
  const dados = {};
  for (const campo of CAMPOS_TEXTO_SIMPLES_PARCIAL) {
    const valor = String(registro[campo] ?? "").trim();
    if (valor) dados[campo] = valor;
  }
  if (normalizados.admissao) dados.admissao = normalizados.admissao;
  if (normalizados.salario) dados.salario = normalizados.salario;
  if (normalizados.cnhValidade) dados.cnhValidade = normalizados.cnhValidade;
  if (normalizados.dataNascimento) dados.dataNascimento = normalizados.dataNascimento;
  if (registro.dependentesNomes?.length > 0) {
    dados.dependentesNomes = registro.dependentesNomes;
    dados.dependentes = registro.dependentes;
  }
  // Preencher "dataDemissao" é o que marca a linha como colaborador desligado
  // (mesmo comportamento do cadastro completo, ver abaixo).
  if (normalizados.dataDemissao) {
    dados.dataDemissao = normalizados.dataDemissao;
    dados.status = "Desligado";
  }
  return dados;
}

// CPF é sempre a chave de match. Se já existe um colaborador com esse CPF, a
// linha sempre atualiza (nunca duplica) — e só sobrescreve os campos que vierem
// preenchidos, completa ou não. Sem match, só uma linha completa (todos os
// campos obrigatórios) pode criar um colaborador novo; incompleta e sem match
// vira erro em vez de criar um cadastro pela metade.
function validarLinha(registro, mapaPorCpf) {
  const erros = [];

  const cpfBruto = String(registro.cpf ?? "").trim();
  if (!cpfBruto) erros.push('"cpf" obrigatório (é a chave usada para localizar ou cadastrar o colaborador)');
  else if (!cpfValido(cpfBruto)) erros.push('"cpf" inválido. Confira os números digitados.');
  const existente = cpfBruto ? mapaPorCpf.get(apenasDigitos(cpfBruto)) : null;

  if (!String(registro.nome ?? "").trim()) erros.push('"nome" obrigatório');

  const admissaoBruta = String(registro.admissao ?? "").trim();
  let admissaoNormalizada = null;
  if (admissaoBruta) {
    admissaoNormalizada = normalizarData(admissaoBruta);
    if (!admissaoNormalizada) erros.push('"admissao" inválida (use AAAA-MM-DD ou DD/MM/AAAA)');
  }
  // Preencher "dataDemissao" é o que marca a linha como colaborador desligado:
  // ao importar, o status vira "Desligado" e um registro em Desligamento
  // Digital é criado automaticamente com essa data (mesmo fluxo do botão
  // "Desligar" manual). Em branco, o colaborador entra/permanece "Ativo".
  const dataDemissaoBruta = String(registro.dataDemissao ?? "").trim();
  let dataDemissaoNormalizada = null;
  if (dataDemissaoBruta) {
    dataDemissaoNormalizada = normalizarData(dataDemissaoBruta);
    if (!dataDemissaoNormalizada) erros.push('"dataDemissao" inválida (use AAAA-MM-DD ou DD/MM/AAAA)');
  }
  const salarioBruto = String(registro.salario ?? "").trim();
  let salarioNormalizado = null;
  if (salarioBruto) {
    salarioNormalizado = normalizarValorMonetario(salarioBruto);
    if (!salarioNormalizado || !Number.isFinite(Number(salarioNormalizado)) || Number(salarioNormalizado) <= 0) {
      erros.push('"salario" inválido (informe um número maior que zero)');
    }
  }
  const cnhValidadeBruta = String(registro.cnhValidade ?? "").trim();
  let cnhValidadeNormalizada = null;
  if (cnhValidadeBruta) {
    cnhValidadeNormalizada = normalizarData(cnhValidadeBruta);
    if (!cnhValidadeNormalizada) erros.push('"cnhValidade" inválida (use AAAA-MM-DD ou DD/MM/AAAA)');
  }
  const dataNascimentoBruta = String(registro.dataNascimento ?? "").trim();
  let dataNascimentoNormalizada = null;
  if (dataNascimentoBruta) {
    dataNascimentoNormalizada = normalizarData(dataNascimentoBruta);
    if (!dataNascimentoNormalizada) erros.push('"dataNascimento" inválida (use AAAA-MM-DD ou DD/MM/AAAA)');
  }

  // Overwrite é sempre parcial (só os campos com valor, ver construirDadosParciais)
  // — mesmo quando a linha está completa e o CPF já existe. "Completa" só decide
  // se a linha PODE criar um colaborador novo quando o CPF não é encontrado.
  const completa = CAMPOS_OBRIGATORIOS.every((campo) => String(registro[campo] ?? "").trim());
  let modo = null;
  if (cpfBruto && cpfValido(cpfBruto)) {
    if (existente) {
      modo = "atualizar";
    } else if (completa) {
      modo = "criar";
    } else {
      const faltando = CAMPOS_OBRIGATORIOS.filter((campo) => !String(registro[campo] ?? "").trim());
      erros.push(
        `Nenhum colaborador com esse CPF está cadastrado, e faltam campos obrigatórios para cadastrar um novo (${faltando.join(", ")})`
      );
    }
  }

  const normalizados = {
    admissao: admissaoNormalizada,
    dataDemissao: dataDemissaoNormalizada,
    salario: salarioNormalizado,
    cnhValidade: cnhValidadeNormalizada,
    dataNascimento: dataNascimentoNormalizada,
  };

  const dadosCompletos = {
    ...registro,
    admissao: admissaoNormalizada ?? registro.admissao,
    dataDemissao: dataDemissaoNormalizada,
    status: dataDemissaoNormalizada ? "Desligado" : "Ativo",
    salario: salarioNormalizado ?? registro.salario,
    cnhValidade: cnhValidadeNormalizada ?? registro.cnhValidade,
    dataNascimento: dataNascimentoNormalizada ?? registro.dataNascimento,
  };

  return {
    dados: dadosCompletos,
    dadosParciais: construirDadosParciais(registro, normalizados),
    modo,
    matriculaAlvo: existente?.id ?? null,
    erros,
  };
}

export default function ImportarColaboradoresForm({
  onImportar,
  onCancelar,
  onLimparTodos,
  totalColaboradores = 0,
  colaboradoresExistentes = [],
}) {
  const [arquivo, setArquivo] = useState(null);
  const [linhasProcessadas, setLinhasProcessadas] = useState(null);
  const [erroArquivo, setErroArquivo] = useState("");
  const [importando, setImportando] = useState(false);

  // CPF (só dígitos) -> colaborador já cadastrado, usado para decidir se uma
  // linha da planilha cria um colaborador novo ou atualiza um existente.
  const mapaPorCpf = useMemo(() => {
    const mapa = new Map();
    colaboradoresExistentes.forEach((c) => {
      const digitos = apenasDigitos(c.cpf);
      if (digitos) mapa.set(digitos, c);
    });
    return mapa;
  }, [colaboradoresExistentes]);

  // .xlsx em vez de .csv: CSV depende de separador/encoding que o Excel
  // interpreta de formas diferentes dependendo do idioma/config do usuário
  // (no pt-BR, por exemplo, a vírgula é separador decimal, não de coluna) —
  // gerava arquivo "corrompido" pra quem abrisse direto no Excel. .xlsx é um
  // formato binário, sem essa ambiguidade.
  function baixarModelo() {
    const planilha = XLSX.utils.aoa_to_sheet([COLUNAS_MODELO]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, planilha, "Modelo");
    XLSX.writeFile(workbook, "modelo_importacao_colaboradores.xlsx");
  }

  function processarRegistros(cabecalho, linhas) {
    // "nome" e "cpf" são as únicas colunas sempre obrigatórias no arquivo —
    // as demais (cargo, departamento, salário etc.) só são obrigatórias por
    // linha quando essa linha está criando um colaborador novo (ver validarLinha).
    const colunasFaltando = ["nome", "cpf"].filter((c) => !cabecalho.includes(c));
    if (colunasFaltando.length > 0) {
      setErroArquivo(`Arquivo sem as colunas obrigatórias: ${colunasFaltando.join(", ")}.`);
      return;
    }
    const processadas = linhas.map((linha) => {
      const registro = extrairDependentes(linha);
      return validarLinha(registro, mapaPorCpf);
    });
    setLinhasProcessadas(processadas);
  }

  function handleArquivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivo(file);
    setErroArquivo("");
    setLinhasProcessadas(null);

    const extensao = file.name.split(".").pop()?.toLowerCase();
    const ehExcel = extensao === "xlsx" || extensao === "xls";

    if (!ehExcel && extensao !== "csv") {
      setErroArquivo("Formato não suportado. Envie um arquivo .csv, .xlsx ou .xls.");
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        const { cabecalho, linhas } = ehExcel
          ? parseExcel(leitor.result)
          : parseCSV(String(leitor.result));
        processarRegistros(cabecalho, linhas);
      } catch {
        setErroArquivo(
          ehExcel
            ? "Não foi possível ler a planilha. Confirme que é um arquivo Excel válido."
            : "Não foi possível ler o arquivo. Confirme que é um CSV válido."
        );
      }
    };
    if (ehExcel) {
      leitor.readAsArrayBuffer(file);
    } else {
      leitor.readAsText(file, "utf-8");
    }
  }

  const validas = linhasProcessadas?.filter((l) => l.erros.length === 0) ?? [];
  const invalidas = linhasProcessadas?.filter((l) => l.erros.length > 0) ?? [];

  async function handleConfirmar() {
    setImportando(true);
    setErroArquivo("");
    try {
      await onImportar(
        validas.map((l) => ({
          modo: l.modo,
          matriculaAlvo: l.matriculaAlvo,
          dados: l.modo === "atualizar" ? l.dadosParciais : l.dados,
        }))
      );
    } catch (err) {
      setErroArquivo(err.message || "Erro ao importar colaboradores.");
    } finally {
      setImportando(false);
    }
  }

  const LABEL_MODO = {
    criar: "Novo cadastro",
    atualizar: "Atualizar (só o preenchido)",
  };

  return (
    <div className="card card-pad" style={{ marginBottom: 18 }}>
      <div className="section-title">Importar colaboradores</div>
      <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 14 }}>
        {isSupabaseConfigured
          ? "Importação gravada direto na base de dados."
          : "Modo demonstração (sem Supabase configurado): importação salva apenas nesta sessão, some ao recarregar a página."}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-outline"
          onClick={baixarModelo}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <Download size={14} /> Baixar modelo Excel
        </button>
        {onLimparTodos && totalColaboradores > 0 && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={onLimparTodos}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-danger)" }}
          >
            Limpar colaboradores atuais ({totalColaboradores})
          </button>
        )}
        <span className="section-hint">
          "nome" e "cpf" são sempre obrigatórios — o CPF localiza o colaborador. Se já existe um
          colaborador com esse CPF, a linha só atualiza os campos que vierem preenchidos (célula
          em branco nunca apaga o que já está cadastrado). Se o CPF não existe, a linha só cria um
          colaborador novo quando estiver completa ({CAMPOS_OBRIGATORIOS.join(", ")}) — senão vira erro.
          {" "}Preencher "dataDemissao" marca o colaborador como Desligado.
        </span>
      </div>

      <label className="upload-drop" htmlFor="import-colaboradores-input">
        <UploadCloud size={22} />
        <span className="file-name" title={arquivo ? arquivo.name : undefined}>{arquivo ? arquivo.name : "Clique para selecionar um arquivo .csv, .xlsx ou .xls"}</span>
        <input
          id="import-colaboradores-input"
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={handleArquivo}
          style={{ display: "none" }}
        />
      </label>

      {erroArquivo && <div className="login-error" style={{ marginTop: 14 }}>{erroArquivo}</div>}

      {linhasProcessadas && linhasProcessadas.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="section-hint" style={{ marginBottom: 8 }}>
            {validas.length} válido(s), {invalidas.length} com erro.
          </div>
          <DataTable
            columns={[
              { key: "nome", label: "Nome", render: (r) => r.dados.nome || "—" },
              { key: "cpf", label: "CPF", render: (r) => r.dados.cpf || "—" },
              {
                key: "modo",
                label: "Modo",
                render: (r) => (r.erros.length === 0 ? LABEL_MODO[r.modo] || "—" : "—"),
              },
              { key: "cargo", label: "Cargo", render: (r) => r.dados.cargo || "—" },
              { key: "filial", label: "Filial", render: (r) => r.dados.filial || "—" },
              { key: "admissao", label: "Admissão", render: (r) => r.dados.admissao || "—" },
              { key: "dataNascimento", label: "Nascimento", render: (r) => r.dados.dataNascimento || "—" },
              {
                key: "situacao",
                label: "Situação",
                render: (r) => {
                  if (r.dados.status === "Desligado") return `Desligado em ${r.dados.dataDemissao}`;
                  return r.modo === "atualizar" ? "Não alterada" : "Ativo";
                },
              },
              {
                key: "status",
                label: "Status",
                render: (r) => <StatusBadge status={r.erros.length === 0 ? "Válido" : "Erro"} />,
              },
              { key: "detalhe", label: "Detalhe", render: (r) => (r.erros.length > 0 ? r.erros.join("; ") : "—") },
            ]}
            rows={linhasProcessadas.map((linha, i) => ({ ...linha, id: i }))}
            rowKey="id"
            isRowBlocked={(row) => row.erros.length > 0}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleConfirmar}
          disabled={validas.length === 0 || importando}
        >
          {importando ? "Importando…" : `Confirmar importação (${validas.length})`}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancelar} disabled={importando}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
