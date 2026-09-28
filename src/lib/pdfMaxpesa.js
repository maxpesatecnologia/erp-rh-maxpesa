// Base visual dos relatórios em PDF (identidade Maxpesa): cores da marca, logo,
// fontes do sistema (Inter no texto, Sora nos títulos), capa, cabeçalho compacto,
// rodapé com paginação e estilo padrão das tabelas. Cada relatório só monta o
// próprio conteúdo em cima disso.
//
// jsPDF, logo e fontes são carregados sob demanda (e ficam em cache) para não
// pesar no bundle das telas que não geram PDF.

export const COR = {
  preto: [13, 14, 16],
  vermelho: [226, 35, 26],
  vermelhoEscuro: [185, 23, 16],
  vermelhoSuave: [252, 236, 235],
  texto: [26, 26, 26],
  textoMuted: [107, 114, 128],
  textoSobreEscuro: [200, 202, 206],
  borda: [217, 220, 225],
  fundoSuave: [247, 247, 248],
  branco: [255, 255, 255],
  verde: [31, 154, 87],
  azul: [37, 112, 177],
  cinza: [107, 114, 128],
  ambar: [201, 142, 30],
};

export const PAGINA = { largura: 210, altura: 297, margem: 16 };
export const LARGURA_UTIL = PAGINA.largura - PAGINA.margem * 2;
export const ALTURA_CABECALHO_CAPA = 50;
export const ALTURA_CABECALHO = 22;

const FONTES = [
  { arquivo: "Inter-Regular.ttf", familia: "Inter", estilo: "normal" },
  { arquivo: "Inter-Bold.ttf", familia: "Inter", estilo: "bold" },
  { arquivo: "Inter-Italic.ttf", familia: "Inter", estilo: "italic" },
  { arquivo: "Sora-Bold.ttf", familia: "Sora", estilo: "bold" },
];

async function carregarDataUrl(url) {
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) return null;
    const blob = await resposta.blob();
    return await new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result);
      leitor.onerror = reject;
      leitor.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

let recursosPromise = null;
function carregarRecursos() {
  recursosPromise ??= Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    carregarDataUrl("/logo_branca.png"),
    Promise.all(FONTES.map((f) => carregarDataUrl(`/fonts/${f.arquivo}`))),
  ]).then(([{ jsPDF }, { default: autoTable }, logo, fontes]) => ({
    jsPDF,
    autoTable,
    logo,
    // base64 puro, sem o prefixo "data:...;base64,"
    fontes: fontes.every(Boolean) ? fontes.map((f) => f.slice(f.indexOf(",") + 1)) : null,
  }));
  return recursosPromise;
}

export function dataBr(iso) {
  if (!iso) return "-";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function iniciais(nome) {
  const partes = String(nome || "?").trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function nomeArquivoPdf(prefixo, sufixo) {
  const slug = String(sufixo || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9.]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${prefixo}${slug ? `-${slug}` : ""}-${new Date().toISOString().slice(0, 10)}.pdf`;
}

export async function criarPdfMaxpesa() {
  const { jsPDF, autoTable, logo, fontes } = await carregarRecursos();
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Se as fontes não carregarem (ex.: offline), cai para Helvetica sem quebrar o relatório.
  if (fontes) {
    FONTES.forEach((f, i) => {
      doc.addFileToVFS(f.arquivo, fontes[i]);
      doc.addFont(f.arquivo, f.familia, f.estilo);
    });
  }
  const FAMILIA_TEXTO = fontes ? "Inter" : "helvetica";
  const FAMILIA_TITULO = fontes ? "Sora" : "helvetica";
  const { largura, altura, margem } = PAGINA;

  const cor = (tipo, rgb) => doc[`set${tipo}Color`](...rgb);

  // Texto corrido (Inter). estilo: "normal" | "bold" | "italic".
  function texto(tamanho, estilo = "normal") {
    doc.setFont(FAMILIA_TEXTO, estilo);
    doc.setFontSize(tamanho);
  }

  // Títulos e números em destaque (Sora, como os headings do sistema).
  function titulo(tamanho) {
    doc.setFont(FAMILIA_TITULO, "bold");
    doc.setFontSize(tamanho);
  }

  function desenharLogo(x, y, alturaLogo) {
    if (!logo) {
      titulo(alturaLogo * 1.6);
      cor("Text", COR.branco);
      doc.text("MAXPESA", x, y + alturaLogo * 0.75);
      return;
    }
    doc.addImage(logo, "PNG", x, y, (alturaLogo * 1372) / 409, alturaLogo, undefined, "FAST");
  }

  function tituloSecao(rotulo, y) {
    cor("Fill", COR.vermelho);
    doc.rect(margem, y - 3.6, 1.2, 4.6, "F");
    titulo(10.5);
    cor("Text", COR.preto);
    doc.text(rotulo.toUpperCase(), margem + 3.5, y);
    return y + 5;
  }

  function desenharCapa({ rotulo, tituloRelatorio, linha }) {
    cor("Fill", COR.preto);
    doc.rect(0, 0, largura, ALTURA_CABECALHO_CAPA, "F");
    cor("Fill", COR.vermelho);
    doc.rect(0, ALTURA_CABECALHO_CAPA, largura, 1.6, "F");
    // traço diagonal decorativo, remetendo ao "swoosh" da logo
    cor("Fill", COR.vermelhoEscuro);
    doc.triangle(largura - 58, ALTURA_CABECALHO_CAPA, largura, 14, largura, ALTURA_CABECALHO_CAPA, "F");
    cor("Fill", COR.vermelho);
    doc.triangle(largura - 40, ALTURA_CABECALHO_CAPA, largura, 26, largura, ALTURA_CABECALHO_CAPA, "F");

    desenharLogo(margem, 11, 11);
    texto(7.5, "bold");
    cor("Text", COR.vermelho);
    doc.text(rotulo.toUpperCase(), margem, 32, { charSpace: 0.3 });
    titulo(19);
    cor("Text", COR.branco);
    doc.text(tituloRelatorio, margem, 40);
    texto(8.5);
    cor("Text", COR.textoSobreEscuro);
    doc.text(linha, margem, 46);
    return ALTURA_CABECALHO_CAPA + 11;
  }

  // Linha de cards de indicador: [{ rotulo, valor, extra }]. Devolve o y logo abaixo.
  function desenharKpis(y, kpis) {
    const gap = 4;
    const larguraKpi = (LARGURA_UTIL - gap * (kpis.length - 1)) / kpis.length;
    kpis.forEach((kpi, i) => {
      const x = margem + i * (larguraKpi + gap);
      cor("Fill", COR.fundoSuave);
      cor("Draw", COR.borda);
      doc.setLineWidth(0.2);
      doc.roundedRect(x, y, larguraKpi, 25, 2, 2, "FD");
      cor("Fill", COR.vermelho);
      doc.rect(x, y + 4, 1.1, 17, "F");
      texto(6.5, "bold");
      cor("Text", COR.textoMuted);
      doc.text(kpi.rotulo.toUpperCase(), x + 4.5, y + 6.5);
      titulo(kpi.valor.length > 9 ? 11 : 16);
      cor("Text", COR.preto);
      doc.text(doc.splitTextToSize(kpi.valor, larguraKpi - 7)[0], x + 4.5, y + 15.5);
      texto(7);
      cor("Text", COR.textoMuted);
      doc.text(doc.splitTextToSize(String(kpi.extra ?? ""), larguraKpi - 7)[0], x + 4.5, y + 21);
    });
    return y + 25;
  }

  const estiloTabela = {
    theme: "plain",
    margin: { left: margem, right: margem, top: ALTURA_CABECALHO + 8, bottom: 20 },
    styles: {
      font: FAMILIA_TEXTO,
      fontSize: 8.3,
      textColor: COR.texto,
      cellPadding: { top: 2.4, bottom: 2.4, left: 2.5, right: 2.5 },
      lineColor: COR.borda,
    },
    headStyles: { fillColor: COR.preto, textColor: COR.branco, fontStyle: "bold", fontSize: 7.3 },
    alternateRowStyles: { fillColor: COR.fundoSuave },
    bodyStyles: { lineWidth: { bottom: 0.1 } },
  };

  function tabela(opcoes) {
    autoTable(doc, { ...estiloTabela, ...opcoes });
    return doc.lastAutoTable.finalY;
  }

  // Cabeçalho compacto (da página 2 em diante), rodapé e paginação; depois baixa o arquivo.
  function finalizar({ tituloCabecalho, subtituloCabecalho, propriedades, nomeArquivo }) {
    const totalPaginas = doc.getNumberOfPages();
    for (let p = 1; p <= totalPaginas; p++) {
      doc.setPage(p);
      if (p > 1) {
        cor("Fill", COR.preto);
        doc.rect(0, 0, largura, ALTURA_CABECALHO, "F");
        cor("Fill", COR.vermelho);
        doc.rect(0, ALTURA_CABECALHO, largura, 1, "F");
        desenharLogo(margem, 6, 10);
        titulo(9);
        cor("Text", COR.branco);
        doc.text(tituloCabecalho, largura - margem, 10.5, { align: "right" });
        texto(7.3);
        cor("Text", COR.textoSobreEscuro);
        doc.text(subtituloCabecalho, largura - margem, 15, { align: "right" });
      }

      const yRodape = altura - 10;
      cor("Draw", COR.borda);
      doc.setLineWidth(0.2);
      doc.line(margem, yRodape - 4, largura - margem, yRodape - 4);
      texto(6.8);
      cor("Text", COR.textoMuted);
      doc.text("Grupo Maxpesa  ·  Recursos Humanos  ·  Documento confidencial", margem, yRodape);
      texto(6.8, "bold");
      cor("Text", COR.preto);
      doc.text(`Página ${p} de ${totalPaginas}`, largura - margem, yRodape, { align: "right" });
    }

    doc.setProperties({ creator: "Maxpesa ERP RH", ...propriedades });
    doc.save(nomeArquivo);
  }

  return { doc, cor, texto, titulo, tituloSecao, desenharCapa, desenharKpis, tabela, finalizar };
}

export function dataHoraAgora() {
  return new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
