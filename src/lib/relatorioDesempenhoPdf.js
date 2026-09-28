// Relatório de Avaliação de Desempenho em PDF. Página 1 traz o consolidado do
// ciclo (indicadores, distribuição por conceito e classificação geral); depois,
// uma página por colaborador avaliado com competências, metas e PDI.
// Visual (capa, fontes, cabeçalho/rodapé) vem de pdfMaxpesa.js.
import {
  PESO_AUTOAVALIACAO,
  PESO_GESTOR,
  PESO_BLOCO_COMPETENCIAS,
  PESO_BLOCO_METAS,
  calcularNotaItem,
  calcularNotaBloco,
  calcularNotaFinal,
  conceitoDaNota,
  formatarNota,
} from "./avaliacaoCalculo";
import {
  COR,
  PAGINA,
  LARGURA_UTIL,
  ALTURA_CABECALHO,
  criarPdfMaxpesa,
  dataBr,
  dataHoraAgora,
  iniciais,
  nomeArquivoPdf,
} from "./pdfMaxpesa";

const COR_CONCEITO = {
  Excepcional: COR.verde,
  "Acima do esperado": COR.azul,
  "Dentro do esperado": COR.cinza,
  "Abaixo do esperado": COR.ambar,
  Insatisfatório: COR.vermelho,
};
// Versões mais claras das mesmas cores, legíveis sobre o fundo preto da caixa da nota.
const COR_CONCEITO_SOBRE_ESCURO = {
  Excepcional: [120, 205, 155],
  "Acima do esperado": [125, 175, 228],
  "Dentro do esperado": COR.textoSobreEscuro,
  "Abaixo do esperado": [232, 190, 100],
  Insatisfatório: [255, 110, 100],
};
const ORDEM_CONCEITOS = Object.keys(COR_CONCEITO);

const ROTULO_STATUS = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

export async function gerarRelatorioDesempenhoPdf({ avaliacoes, ciclo, geradoPor }) {
  const avaliados = avaliacoes
    .map((a) => ({ ...a, notaFinal: calcularNotaFinal(a) }))
    .filter((a) => a.notaFinal != null)
    .sort((a, b) => b.notaFinal - a.notaFinal || (a.colaborador?.nome || "").localeCompare(b.colaborador?.nome || ""));
  if (avaliados.length === 0) throw new Error("Nenhum colaborador avaliado para gerar o relatório.");
  const emAndamento = avaliacoes.length - avaliados.length;

  const pdf = await criarPdfMaxpesa();
  const { doc, cor, texto, titulo, tituloSecao, tabela } = pdf;
  const { largura, margem } = PAGINA;

  // ───────── Capa / consolidado ─────────
  let y = pdf.desenharCapa({
    rotulo: "Relatório de RH",
    tituloRelatorio: "Avaliação de Desempenho",
    linha: `Ciclo ${ciclo}  ·  Gerado em ${dataHoraAgora()}${geradoPor ? `  ·  por ${geradoPor}` : ""}`,
  });

  const notas = avaliados.map((a) => a.notaFinal);
  const media = notas.reduce((s, n) => s + n, 0) / notas.length;
  const totalPdi = avaliados.reduce((s, a) => s + a.pdi.length, 0);
  const pdiConcluido = avaliados.reduce((s, a) => s + a.pdi.filter((p) => p.status === "concluido").length, 0);
  y = pdf.desenharKpis(y, [
    { rotulo: "Avaliados", valor: String(avaliados.length), extra: emAndamento ? `+${emAndamento} em andamento` : "ciclo completo" },
    { rotulo: "Média geral", valor: formatarNota(media), extra: conceitoDaNota(media) },
    { rotulo: "Maior nota", valor: formatarNota(Math.max(...notas)), extra: `menor: ${formatarNota(Math.min(...notas))}` },
    { rotulo: "PDI concluído", valor: totalPdi ? `${Math.round((pdiConcluido / totalPdi) * 100)}%` : "-", extra: `${pdiConcluido} de ${totalPdi} ações` },
  ]);
  y += 11;

  // Distribuição por conceito
  y = tituloSecao("Distribuição por conceito", y) + 2;
  const contagem = Object.fromEntries(ORDEM_CONCEITOS.map((c) => [c, 0]));
  avaliados.forEach((a) => (contagem[conceitoDaNota(a.notaFinal)] += 1));
  const larguraRotulo = 38;
  const larguraBarraMax = LARGURA_UTIL - larguraRotulo - 22;
  ORDEM_CONCEITOS.forEach((conceito) => {
    const qtd = contagem[conceito];
    const pct = qtd / avaliados.length;
    texto(8.3);
    cor("Text", COR.texto);
    doc.text(conceito, margem, y + 3.3);
    cor("Fill", COR.fundoSuave);
    doc.roundedRect(margem + larguraRotulo, y, larguraBarraMax, 4.6, 1.2, 1.2, "F");
    if (qtd > 0) {
      cor("Fill", COR_CONCEITO[conceito]);
      doc.roundedRect(margem + larguraRotulo, y, Math.max(larguraBarraMax * pct, 2.4), 4.6, 1.2, 1.2, "F");
    }
    texto(8.3, "bold");
    cor("Text", qtd ? COR.preto : COR.textoMuted);
    doc.text(`${qtd}  (${Math.round(pct * 100)}%)`, largura - margem, y + 3.3, { align: "right" });
    y += 7.4;
  });
  y += 6;

  // Classificação geral
  y = tituloSecao("Classificação geral", y);
  y = tabela({
    startY: y,
    head: [["#", "Colaborador", "Cargo", "Departamento", "Compet.", "Metas", "Nota final", "Conceito"]],
    body: avaliados.map((a, i) => [
      String(i + 1),
      a.colaborador?.nome ?? "-",
      a.colaborador?.cargo ?? "-",
      a.colaborador?.departamento ?? "-",
      formatarNota(calcularNotaBloco(a.competencias)),
      formatarNota(calcularNotaBloco(a.metas)),
      formatarNota(a.notaFinal),
      conceitoDaNota(a.notaFinal),
    ]),
    columnStyles: {
      0: { halign: "center", cellWidth: 8, textColor: COR.textoMuted },
      1: { fontStyle: "bold" },
      4: { halign: "center", cellWidth: 16 },
      5: { halign: "center", cellWidth: 14 },
      6: { halign: "center", cellWidth: 18, fontStyle: "bold", fontSize: 10 },
      7: { cellWidth: 36, fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "head" && [0, 4, 5, 6].includes(data.column.index)) data.cell.styles.halign = "center";
      if (data.section === "body" && data.column.index === 7) data.cell.styles.textColor = COR_CONCEITO[data.cell.raw] ?? COR.texto;
      if (data.section === "body" && data.column.index === 6) data.cell.styles.textColor = COR.vermelho;
    },
  });

  y += 6;
  texto(7.3, "italic");
  cor("Text", COR.textoMuted);
  const nota =
    `Metodologia: cada item = ${PESO_AUTOAVALIACAO * 100}% autoavaliação + ${PESO_GESTOR * 100}% gestor; ` +
    `nota final = ${PESO_BLOCO_COMPETENCIAS * 100}% competências + ${PESO_BLOCO_METAS * 100}% metas (escala 1 a 5).` +
    (emAndamento ? ` ${emAndamento} avaliação(ões) ainda em andamento não entram neste relatório.` : "");
  doc.text(doc.splitTextToSize(nota, LARGURA_UTIL), margem, y);

  // ───────── Uma página por colaborador ─────────
  avaliados.forEach((a, indice) => {
    doc.addPage();
    const c = a.colaborador ?? {};
    let yy = ALTURA_CABECALHO + 10;

    // Cartão de identificação
    cor("Fill", COR.fundoSuave);
    cor("Draw", COR.borda);
    doc.setLineWidth(0.2);
    doc.roundedRect(margem, yy, LARGURA_UTIL, 30, 2.5, 2.5, "FD");
    cor("Fill", COR.vermelho);
    doc.circle(margem + 13, yy + 15, 8.5, "F");
    titulo(11.5);
    cor("Text", COR.branco);
    doc.text(iniciais(c.nome), margem + 13, yy + 17, { align: "center" });

    texto(6.8, "bold");
    cor("Text", COR.vermelho);
    doc.text(`${indice + 1}º NA CLASSIFICAÇÃO GERAL`, margem + 26, yy + 9);
    titulo(13.5);
    cor("Text", COR.preto);
    doc.text(doc.splitTextToSize(c.nome ?? "-", LARGURA_UTIL - 80)[0], margem + 26, yy + 15.5);
    texto(8.3);
    cor("Text", COR.textoMuted);
    const linhaInfo = [c.cargo, c.departamento].filter(Boolean).join("  ·  ") || "-";
    doc.text(doc.splitTextToSize(linhaInfo, LARGURA_UTIL - 80)[0], margem + 26, yy + 20.5);
    doc.text(`Gestor: ${c.gestor || "-"}  ·  Matrícula: ${c.id ?? "-"}`, margem + 26, yy + 25);

    // Caixa da nota final
    const conceito = conceitoDaNota(a.notaFinal);
    const xNota = largura - margem - 44;
    cor("Fill", COR.preto);
    doc.roundedRect(xNota, yy + 3, 41, 24, 2, 2, "F");
    texto(6.3, "bold");
    cor("Text", COR.textoSobreEscuro);
    doc.text("NOTA FINAL", xNota + 20.5, yy + 8.5, { align: "center" });
    titulo(19);
    cor("Text", COR.branco);
    doc.text(formatarNota(a.notaFinal), xNota + 20.5, yy + 17.5, { align: "center" });
    texto(6.6, "bold");
    cor("Text", COR_CONCEITO_SOBRE_ESCURO[conceito] ?? COR.branco);
    doc.text(conceito.toUpperCase(), xNota + 20.5, yy + 23, { align: "center" });
    yy += 30 + 8;

    // Régua da nota (1 a 5)
    cor("Fill", COR.fundoSuave);
    doc.roundedRect(margem, yy, LARGURA_UTIL, 3, 1.5, 1.5, "F");
    cor("Fill", COR.vermelho);
    doc.roundedRect(margem, yy, Math.max(((a.notaFinal - 1) / 4) * LARGURA_UTIL, 3), 3, 1.5, 1.5, "F");
    texto(6.6);
    cor("Text", COR.textoMuted);
    [1, 2, 3, 4, 5].forEach((n) => {
      const x = margem + ((n - 1) / 4) * LARGURA_UTIL;
      doc.text(String(n), x, yy + 7, { align: n === 1 ? "left" : n === 5 ? "right" : "center" });
    });
    yy += 14;

    // Blocos
    const blocos = [
      { rotulo: `Bloco competências (${PESO_BLOCO_COMPETENCIAS * 100}%)`, valor: formatarNota(calcularNotaBloco(a.competencias)) },
      { rotulo: `Bloco metas (${PESO_BLOCO_METAS * 100}%)`, valor: formatarNota(calcularNotaBloco(a.metas)) },
      {
        rotulo: "Metas atingidas (média)",
        valor: a.metas.length ? `${Math.round(a.metas.reduce((s, m) => s + (Number(m.percentualAtingido) || 0), 0) / a.metas.length)}%` : "-",
      },
    ];
    const gap = 4;
    const larguraBloco = (LARGURA_UTIL - gap * 2) / 3;
    blocos.forEach((b, i) => {
      const x = margem + i * (larguraBloco + gap);
      cor("Draw", COR.borda);
      doc.setLineWidth(0.2);
      doc.roundedRect(x, yy, larguraBloco, 16, 2, 2, "S");
      texto(6.5, "bold");
      cor("Text", COR.textoMuted);
      doc.text(b.rotulo.toUpperCase(), x + 4, yy + 5.5);
      titulo(12.5);
      cor("Text", COR.preto);
      doc.text(b.valor, x + 4, yy + 12.5);
    });
    yy += 16 + 10;

    yy = tituloSecao("Competências", yy);
    yy = tabela({
      startY: yy,
      head: [["Competência", "Peso", "Autoavaliação", "Gestor", "Nota"]],
      body: a.competencias.map((i) => [i.nome, `${i.peso}%`, i.autoavaliacao ?? "-", i.gestor ?? "-", formatarNota(calcularNotaItem(i))]),
      columnStyles: {
        1: { halign: "center", cellWidth: 18 },
        2: { halign: "center", cellWidth: 26 },
        3: { halign: "center", cellWidth: 20 },
        4: { halign: "center", cellWidth: 18, fontStyle: "bold", textColor: COR.vermelho },
      },
      didParseCell: (d) => {
        if (d.section === "head" && d.column.index > 0) d.cell.styles.halign = "center";
      },
    });
    yy += 10;

    yy = tituloSecao("Metas do ciclo", yy);
    yy = tabela({
      startY: yy,
      head: [["Meta", "Peso", "Atingido", "Auto", "Gestor", "Nota", "Status"]],
      body: a.metas.map((m) => [
        m.descricao,
        `${m.peso}%`,
        `${m.percentualAtingido ?? 0}%`,
        m.autoavaliacao ?? "-",
        m.gestor ?? "-",
        formatarNota(calcularNotaItem(m)),
        ROTULO_STATUS[m.status] ?? m.status ?? "-",
      ]),
      columnStyles: {
        1: { halign: "center", cellWidth: 15 },
        2: { halign: "center", cellWidth: 18 },
        3: { halign: "center", cellWidth: 14 },
        4: { halign: "center", cellWidth: 15 },
        5: { halign: "center", cellWidth: 14, fontStyle: "bold", textColor: COR.vermelho },
        6: { cellWidth: 26 },
      },
      didParseCell: (d) => {
        if (d.section === "head" && d.column.index > 0 && d.column.index < 6) d.cell.styles.halign = "center";
      },
    });
    yy += 10;

    const concluidas = a.pdi.filter((p) => p.status === "concluido").length;
    yy = tituloSecao(`Plano de Desenvolvimento Individual (PDI)${a.pdi.length ? `  ·  ${concluidas}/${a.pdi.length} concluídas` : ""}`, yy);
    if (a.pdi.length === 0) {
      texto(8.3, "italic");
      cor("Text", COR.textoMuted);
      doc.text("Nenhuma ação de PDI registrada neste ciclo.", margem, yy + 3);
      return;
    }
    const hoje = new Date().toISOString().slice(0, 10);
    tabela({
      startY: yy,
      head: [["Ação de desenvolvimento", "Prazo", "Status"]],
      body: a.pdi.map((p) => {
        const atrasado = p.status !== "concluido" && p.prazo && p.prazo < hoje;
        return [p.acao, dataBr(p.prazo), `${ROTULO_STATUS[p.status] ?? p.status}${atrasado ? " (atrasado)" : ""}`];
      }),
      columnStyles: { 1: { halign: "center", cellWidth: 24 }, 2: { cellWidth: 48 } },
      didParseCell: (d) => {
        if (d.section === "head" && d.column.index === 1) d.cell.styles.halign = "center";
        if (d.section === "body" && d.column.index === 2) {
          const raw = String(d.cell.raw);
          d.cell.styles.fontStyle = "bold";
          d.cell.styles.textColor = raw.includes("atrasado") ? COR.vermelho : raw.startsWith("Concluído") ? COR.verde : COR.ambar;
        }
      },
    });
  });

  pdf.finalizar({
    tituloCabecalho: "Avaliação de Desempenho",
    subtituloCabecalho: `Ciclo ${ciclo}`,
    propriedades: {
      title: `Relatório de Avaliação de Desempenho - ${ciclo}`,
      subject: "Avaliação de Desempenho",
      author: geradoPor || "Grupo Maxpesa",
    },
    nomeArquivo: nomeArquivoPdf("relatorio-desempenho", ciclo),
  });
}
