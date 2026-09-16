import { useState } from "react";
import { UploadCloud, Download } from "lucide-react";
import * as XLSX from "xlsx";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { CAMPOS_OBRIGATORIOS } from "./NovoColaboradorForm";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

const COLUNAS_MODELO = [
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
  "admissao",
  "salario",
  "dependentes",
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

// Troca os nomes do cabeçalho do arquivo pelos nomes canônicos usados no
// resto do sistema (ex.: "Admissão" vira "admissao"), quando reconhecidos.
function mapearCabecalho(cabecalho) {
  const porNomeNormalizado = new Map(
    COLUNAS_MODELO.map((campo) => [normalizarNomeColuna(campo), campo])
  );
  return cabecalho.map((coluna) => porNomeNormalizado.get(normalizarNomeColuna(coluna)) ?? coluna);
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
const CAMPOS_NUMERICOS = ["salario", "dependentes"];

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

// filial, cargo e admissao podem chegar em branco na importação (preenchidos
// depois, diretamente no cadastro) — os demais campos obrigatórios bloqueiam
// a linha. admissao, quando informada, ainda precisa ser uma data válida.
const CAMPOS_OPCIONAIS_NA_IMPORTACAO = ["filial", "cargo", "admissao"];

function validarLinha(registro) {
  const erros = [];
  for (const campo of CAMPOS_OBRIGATORIOS) {
    if (campo === "admissao") continue;
    if (CAMPOS_OPCIONAIS_NA_IMPORTACAO.includes(campo)) continue;
    if (!String(registro[campo] ?? "").trim()) erros.push(`"${campo}" obrigatório`);
  }
  const admissaoBruta = String(registro.admissao ?? "").trim();
  let admissaoNormalizada = null;
  if (admissaoBruta) {
    admissaoNormalizada = normalizarData(admissaoBruta);
    if (!admissaoNormalizada) erros.push('"admissao" inválida (use AAAA-MM-DD ou DD/MM/AAAA)');
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
  return { erros, admissaoNormalizada, salarioNormalizado, cnhValidadeNormalizada };
}

export default function ImportarColaboradoresForm({ onImportar, onCancelar, onLimparTodos, totalColaboradores = 0 }) {
  const [arquivo, setArquivo] = useState(null);
  const [linhasProcessadas, setLinhasProcessadas] = useState(null);
  const [erroArquivo, setErroArquivo] = useState("");
  const [importando, setImportando] = useState(false);

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
    const colunasFaltando = CAMPOS_OBRIGATORIOS.filter((c) => !cabecalho.includes(c));
    if (colunasFaltando.length > 0) {
      setErroArquivo(`Arquivo sem as colunas obrigatórias: ${colunasFaltando.join(", ")}.`);
      return;
    }
    const processadas = linhas.map((registro) => {
      const { erros, admissaoNormalizada, salarioNormalizado, cnhValidadeNormalizada } = validarLinha(registro);
      return {
        dados: {
          ...registro,
          admissao: admissaoNormalizada ?? registro.admissao,
          salario: salarioNormalizado ?? registro.salario,
          cnhValidade: cnhValidadeNormalizada ?? registro.cnhValidade,
        },
        erros,
      };
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
      await onImportar(validas.map((l) => l.dados));
    } catch (err) {
      setErroArquivo(err.message || "Erro ao importar colaboradores.");
    } finally {
      setImportando(false);
    }
  }

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
          Colunas obrigatórias: {CAMPOS_OBRIGATORIOS.filter((c) => !CAMPOS_OPCIONAIS_NA_IMPORTACAO.includes(c)).join(", ")}.
          {" "}(as demais — {CAMPOS_OPCIONAIS_NA_IMPORTACAO.join(", ")} — podem ficar em branco e ser preenchidas depois.)
        </span>
      </div>

      <label className="upload-drop" htmlFor="import-colaboradores-input">
        <UploadCloud size={22} />
        <span>{arquivo ? arquivo.name : "Clique para selecionar um arquivo .csv, .xlsx ou .xls"}</span>
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
              { key: "cargo", label: "Cargo", render: (r) => r.dados.cargo || "—" },
              { key: "filial", label: "Filial", render: (r) => r.dados.filial || "—" },
              { key: "admissao", label: "Admissão", render: (r) => r.dados.admissao || "—" },
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
