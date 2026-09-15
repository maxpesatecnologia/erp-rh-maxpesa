import { useEffect, useMemo, useState } from "react";
import { UploadCloud, Download } from "lucide-react";
import * as XLSX from "xlsx";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { CAMPOS_OBRIGATORIOS } from "./NovoColaboradorForm";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

const COLUNAS_MODELO = [
  "nome",
  "codigoDominio",
  "cargo",
  "departamento",
  "filial",
  "centroCusto",
  "gestor",
  "equipe",
  "admissao",
  "escolaridade",
  "dependentes",
  "cnhCategoria",
  "cnhValidade",
  "nrs",
  "certificacoes",
  "equipamentos",
];

const LINHA_EXEMPLO = [
  "Fernanda Costa",
  "DOM-10099",
  "Auxiliar Administrativo",
  "Recursos Humanos",
  "Matriz - Campinas",
  "CC-101",
  "Ana Ribeiro",
  "RH Corporativo",
  "2026-09-15",
  "Ensino Médio Completo",
  "1",
  "",
  "",
  "",
  "",
  "",
];

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
  const cabecalho = parseLinhaCSV(linhas[0], delimitador);
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
  const cabecalho = linhas[0].map((c) => String(c ?? "").trim());
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

// Lê a primeira planilha de um arquivo .xlsx/.xls célula a célula (em vez de
// usar sheet_to_json com raw:false), pra conseguir cair pro valor bruto quando
// o texto formatado não estiver em cache no arquivo.
function parseExcel(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  const primeiraAba = workbook.Sheets[workbook.SheetNames[0]];
  if (!primeiraAba["!ref"]) return { cabecalho: [], linhas: [] };
  const intervalo = XLSX.utils.decode_range(primeiraAba["!ref"]);
  const matriz = [];
  for (let linha = intervalo.s.r; linha <= intervalo.e.r; linha++) {
    const valoresLinha = [];
    for (let coluna = intervalo.s.c; coluna <= intervalo.e.c; coluna++) {
      const endereco = XLSX.utils.encode_cell({ r: linha, c: coluna });
      valoresLinha.push(celulaParaTexto(primeiraAba[endereco]));
    }
    matriz.push(valoresLinha);
  }
  return linhasParaRegistros(matriz);
}

// Aceita AAAA-MM-DD (padrão interno) e DD/MM/AAAA (comum em export de Excel BR).
function normalizarData(valor) {
  if (!valor) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const match = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, d, m, a] = match;
    return `${a}-${m}-${d}`;
  }
  return null;
}

// filial, gestor, cargo e admissao podem chegar em branco na importação
// (preenchidos depois, diretamente no cadastro) — só nome e departamento
// bloqueiam a linha. admissao, quando informada, ainda precisa ser uma data válida.
const CAMPOS_OPCIONAIS_NA_IMPORTACAO = ["filial", "gestor", "cargo", "admissao"];

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
  return { erros, admissaoNormalizada };
}

export default function ImportarColaboradoresForm({ onImportar, onCancelar }) {
  const [arquivo, setArquivo] = useState(null);
  const [linhasProcessadas, setLinhasProcessadas] = useState(null);
  const [erroArquivo, setErroArquivo] = useState("");
  const [importando, setImportando] = useState(false);

  const modeloUrl = useMemo(() => {
    const conteudo = [COLUNAS_MODELO.join(","), LINHA_EXEMPLO.join(",")].join("\n");
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
    return URL.createObjectURL(blob);
  }, []);

  useEffect(() => () => URL.revokeObjectURL(modeloUrl), [modeloUrl]);

  function processarRegistros(cabecalho, linhas) {
    const colunasFaltando = CAMPOS_OBRIGATORIOS.filter((c) => !cabecalho.includes(c));
    if (colunasFaltando.length > 0) {
      setErroArquivo(`Arquivo sem as colunas obrigatórias: ${colunasFaltando.join(", ")}.`);
      return;
    }
    const processadas = linhas.map((registro) => {
      const { erros, admissaoNormalizada } = validarLinha(registro);
      return { dados: { ...registro, admissao: admissaoNormalizada ?? registro.admissao }, erros };
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
        <a
          className="btn btn-outline"
          href={modeloUrl}
          download="modelo_importacao_colaboradores.csv"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <Download size={14} /> Baixar modelo CSV
        </a>
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
