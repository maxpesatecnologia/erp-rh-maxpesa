import { useMemo, useState } from "react";
import { UploadCloud, Download } from "lucide-react";
import * as XLSX from "xlsx";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";

const COLUNAS_MODELO = [
  "cpf",
  "motivo",
  "dataDesligamento",
  "entrevistaDesligamento",
  "devolucaoEquipamentos",
  "exameDemissional",
  "acertoRescisorio",
];

const COLUNAS_OBRIGATORIAS = ["cpf", "dataDesligamento"];

// Normaliza nome de coluna pra comparar sem se importar com maiúscula/minúscula
// ou acento (ex.: "Data Desligamento" bate com "dataDesligamento").
function normalizarNomeColuna(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

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
// formato comum entre o parser de CSV e o sheet_to_json({header:1}) do Excel.
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

function parseExcel(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  const primeiraAba = workbook.Sheets[workbook.SheetNames[0]];
  const matriz = XLSX.utils.sheet_to_json(primeiraAba, { header: 1, defval: "", raw: false });
  return linhasParaRegistros(matriz);
}

// Aceita AAAA-MM-DD (padrão interno) e D/M/AAAA ou DD/MM/AAAA (comum em
// export de Excel BR). Valida o calendário (rejeita "31/02/2025" etc.).
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

function normalizarCpf(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

// Colunas de etapa aceitam Sim/Não, S/N, true/false ou 1/0 — qualquer outro
// valor (inclusive em branco) conta como etapa ainda não concluída.
function paraBooleano(valor) {
  const texto = String(valor ?? "").trim().toLowerCase();
  return ["sim", "s", "true", "1", "yes", "x"].includes(texto);
}

function validarLinha(registro, colaboradorPorCpf) {
  const erros = [];

  const cpfBruto = String(registro.cpf ?? "").trim();
  let colaborador = null;
  if (!cpfBruto) {
    erros.push('"cpf" obrigatório');
  } else {
    colaborador = colaboradorPorCpf.get(normalizarCpf(cpfBruto)) ?? null;
    if (!colaborador) erros.push("CPF não encontrado no Cadastro de Colaboradores");
  }

  const dataBruta = String(registro.dataDesligamento ?? "").trim();
  let dataNormalizada = null;
  if (!dataBruta) {
    erros.push('"dataDesligamento" obrigatória');
  } else {
    dataNormalizada = normalizarData(dataBruta);
    if (!dataNormalizada) erros.push('"dataDesligamento" inválida (use AAAA-MM-DD ou DD/MM/AAAA)');
  }

  const checklist = {
    entrevistaDesligamento: paraBooleano(registro.entrevistaDesligamento),
    devolucaoEquipamentos: paraBooleano(registro.devolucaoEquipamentos),
    exameDemissional: paraBooleano(registro.exameDemissional),
    acertoRescisorio: paraBooleano(registro.acertoRescisorio),
  };

  return { erros, colaborador, dataNormalizada, checklist };
}

export default function ImportarDesligamentosForm({ colaboradores, onImportar, onCancelar }) {
  const [arquivo, setArquivo] = useState(null);
  const [linhasProcessadas, setLinhasProcessadas] = useState(null);
  const [erroArquivo, setErroArquivo] = useState("");
  const [importando, setImportando] = useState(false);

  const colaboradorPorCpf = useMemo(() => {
    const mapa = new Map();
    colaboradores.forEach((c) => {
      if (c.cpf) mapa.set(normalizarCpf(c.cpf), c);
    });
    return mapa;
  }, [colaboradores]);

  function baixarModelo() {
    const planilha = XLSX.utils.aoa_to_sheet([COLUNAS_MODELO]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, planilha, "Modelo");
    XLSX.writeFile(workbook, "modelo_importacao_desligamentos.xlsx");
  }

  function processarRegistros(cabecalho, linhas) {
    const colunasFaltando = COLUNAS_OBRIGATORIAS.filter((c) => !cabecalho.includes(c));
    if (colunasFaltando.length > 0) {
      setErroArquivo(`Arquivo sem as colunas obrigatórias: ${colunasFaltando.join(", ")}.`);
      return;
    }
    const processadas = linhas.map((registro) => ({
      registro,
      ...validarLinha(registro, colaboradorPorCpf),
    }));
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
          colaboradorId: l.colaborador.id,
          motivo: l.registro.motivo || "",
          dataDesligamento: l.dataNormalizada,
          checklist: l.checklist,
        }))
      );
    } catch (err) {
      setErroArquivo(err.message || "Erro ao importar desligamentos.");
    } finally {
      setImportando(false);
    }
  }

  return (
    <div className="card card-pad" style={{ marginBottom: 18 }}>
      <div className="section-title">Importar desligamentos</div>
      <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 14 }}>
        Use para registrar de uma vez o histórico de desligamentos antigos e a situação dos atuais. Cada linha é
        associada a um colaborador já cadastrado pelo CPF.
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
        <span className="section-hint">
          Colunas obrigatórias: cpf, dataDesligamento. (motivo e as etapas do checklist — entrevistaDesligamento,
          devolucaoEquipamentos, exameDemissional, acertoRescisorio — aceitam Sim/Não e podem ficar em branco.)
        </span>
      </div>

      <label className="upload-drop" htmlFor="import-desligamentos-input">
        <UploadCloud size={22} />
        <span className="file-name" title={arquivo ? arquivo.name : undefined}>{arquivo ? arquivo.name : "Clique para selecionar um arquivo .csv, .xlsx ou .xls"}</span>
        <input
          id="import-desligamentos-input"
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
              { key: "cpf", label: "CPF", render: (r) => r.registro.cpf || "—" },
              { key: "nome", label: "Colaborador", render: (r) => r.colaborador?.nome || "—" },
              { key: "motivo", label: "Motivo", render: (r) => r.registro.motivo || "—" },
              { key: "data", label: "Data desligamento", render: (r) => r.registro.dataDesligamento || "—" },
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
