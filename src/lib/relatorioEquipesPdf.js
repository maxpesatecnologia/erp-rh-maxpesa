// Relatório de Gestão de Equipes em PDF. Página 1 traz o consolidado (última
// avaliação de cada time): indicadores, média por indicador e comparativo entre
// equipes. Depois, uma página por equipe avaliada com os indicadores do último
// período, pontos de atenção, resumo do gestor, evolução e histórico completo.
// Visual (capa, fontes, cabeçalho/rodapé) vem de pdfMaxpesa.js.
import { EQUIPES, INDICADORES_EQUIPE, notaGeralDaAvaliacao } from "./avaliacaoEquipeApi";
import { formatarNota } from "./avaliacaoCalculo";
import { COR, PAGINA, LARGURA_UTIL, ALTURA_CABECALHO, criarPdfMaxpesa, dataHoraAgora, iniciais, nomeArquivoPdf } from "./pdfMaxpesa";

const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const ROTULO_CURTO = { clima: "Clima", produtividade: "Produt.", seguranca: "Segurança", quadro: "Quadro" };

function formatPeriodo(periodo) {
  if (!periodo) return "-";
  const [ano, mes] = periodo.split("-");
  return `${MESES_ABREV[Number(mes) - 1]}/${ano}`;
}

function formatDiferenca(diff) {
  if (diff == null) return "-";
  if (Math.abs(diff) < 0.05) return "estável";
  return `${diff > 0 ? "+" : ""}${formatarNota(diff)}`;
}

function corDaNota(nota) {
  if (nota == null) return COR.textoMuted;
  if (nota >= 4) return COR.verde;
  if (nota >= 3) return COR.azul;
  if (nota >= 2) return COR.ambar;
  return COR.vermelho;
}

export async function gerarRelatorioEquipesPdf({ avaliacoes, geradoPor }) {
  const equipes = [...new Set([...EQUIPES, ...avaliacoes.map((a) => a.equipe)])]
    .map((equipe) => {
      const historico = avaliacoes
        .filter((a) => a.equipe === equipe)
        .map((a) => ({ ...a, nota: notaGeralDaAvaliacao(a.indicadores) }))
        .sort((a, b) => (a.periodo < b.periodo ? 1 : -1));
      const ultima = historico[0];
      const anterior = historico[1];
      const diff = ultima?.nota != null && anterior?.nota != null ? ultima.nota - anterior.nota : null;
      return { equipe, historico, ultima, diff };
    })
    .filter((e) => e.ultima);
  if (equipes.length === 0) throw new Error("Nenhuma equipe avaliada para gerar o relatório.");
  equipes.sort((a, b) => (b.ultima.nota ?? -1) - (a.ultima.nota ?? -1) || a.equipe.localeCompare(b.equipe));

  const semAvaliacao = EQUIPES.filter((e) => !equipes.some((x) => x.equipe === e));
  const pdf = await criarPdfMaxpesa();
  const { doc, cor, texto, titulo, tituloSecao, tabela } = pdf;
  const { largura, margem } = PAGINA;

  // ───────── Capa / consolidado ─────────
  let y = pdf.desenharCapa({
    rotulo: "Relatório de RH",
    tituloRelatorio: "Gestão de Equipes",
    linha: `Última avaliação de cada equipe  ·  Gerado em ${dataHoraAgora()}${geradoPor ? `  ·  por ${geradoPor}` : ""}`,
  });

  const notas = equipes.map((e) => e.ultima.nota).filter((n) => n != null);
  const media = notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null;
  const melhor = equipes[0];
  const comAtencao = equipes.filter((e) => e.ultima.pontosAtencao?.trim()).length;
  y = pdf.desenharKpis(y, [
    { rotulo: "Equipes avaliadas", valor: `${equipes.length}/${EQUIPES.length}`, extra: semAvaliacao.length ? `${semAvaliacao.length} sem avaliação` : "todas avaliadas" },
    { rotulo: "Média geral", valor: formatarNota(media), extra: "escala de 1 a 5" },
    { rotulo: "Melhor equipe", valor: melhor.equipe, extra: `nota ${formatarNota(melhor.ultima.nota)}` },
    { rotulo: "Pontos de atenção", valor: String(comAtencao), extra: comAtencao === 1 ? "equipe com alerta" : "equipes com alerta" },
  ]);
  y += 11;

  // Média por indicador (última avaliação de cada equipe)
  y = tituloSecao("Média por indicador", y) + 2;
  const larguraRotulo = 46;
  const larguraBarraMax = LARGURA_UTIL - larguraRotulo - 16;
  INDICADORES_EQUIPE.forEach((ind) => {
    const valores = equipes.map((e) => Number(e.ultima.indicadores?.[ind.key])).filter(Number.isFinite);
    const valor = valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : null;
    texto(8.3);
    cor("Text", COR.texto);
    doc.text(ind.label, margem, y + 3.3);
    cor("Fill", COR.fundoSuave);
    doc.roundedRect(margem + larguraRotulo, y, larguraBarraMax, 4.6, 1.2, 1.2, "F");
    if (valor != null) {
      cor("Fill", corDaNota(valor));
      doc.roundedRect(margem + larguraRotulo, y, Math.max((valor / 5) * larguraBarraMax, 2.4), 4.6, 1.2, 1.2, "F");
    }
    texto(8.3, "bold");
    cor("Text", COR.preto);
    doc.text(formatarNota(valor), largura - margem, y + 3.3, { align: "right" });
    y += 7.4;
  });
  y += 6;

  // Comparativo entre equipes
  y = tituloSecao("Comparativo entre equipes", y);
  y = tabela({
    startY: y,
    head: [["#", "Equipe", "Período", "Gestor", ...INDICADORES_EQUIPE.map((i) => ROTULO_CURTO[i.key] ?? i.label), "Nota", "Tendência"]],
    body: equipes.map((e, i) => [
      String(i + 1),
      e.equipe,
      formatPeriodo(e.ultima.periodo),
      e.ultima.gestorResponsavel || "-",
      ...INDICADORES_EQUIPE.map((ind) => e.ultima.indicadores?.[ind.key] ?? "-"),
      formatarNota(e.ultima.nota),
      formatDiferenca(e.diff),
    ]),
    columnStyles: {
      0: { halign: "center", cellWidth: 7, textColor: COR.textoMuted },
      1: { fontStyle: "bold" },
      2: { halign: "center", cellWidth: 18 },
      4: { halign: "center", cellWidth: 12 },
      5: { halign: "center", cellWidth: 14 },
      6: { halign: "center", cellWidth: 19 },
      7: { halign: "center", cellWidth: 14 },
      8: { halign: "center", cellWidth: 13, fontStyle: "bold", fontSize: 10, textColor: COR.vermelho },
      9: { halign: "center", cellWidth: 18, fontStyle: "bold" },
    },
    didParseCell: (d) => {
      if (d.section === "head" && d.column.index !== 1 && d.column.index !== 3) d.cell.styles.halign = "center";
      if (d.section === "body" && d.column.index === 9) {
        const raw = String(d.cell.raw);
        d.cell.styles.textColor = raw.startsWith("+") ? COR.verde : raw.startsWith("-") && raw !== "-" ? COR.vermelho : COR.textoMuted;
      }
    },
  });

  y += 6;
  texto(7.3, "italic");
  cor("Text", COR.textoMuted);
  const nota =
    "Nota geral = média simples dos 4 indicadores (escala 1 a 5). Tendência compara com o período anterior da mesma equipe." +
    (semAvaliacao.length ? ` Sem avaliação registrada: ${semAvaliacao.join(", ")}.` : "");
  doc.text(doc.splitTextToSize(nota, LARGURA_UTIL), margem, y);

  // ───────── Uma página por equipe ─────────
  equipes.forEach((e, indice) => {
    doc.addPage();
    const { ultima, historico } = e;
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
    doc.text(iniciais(e.equipe), margem + 13, yy + 17, { align: "center" });

    texto(6.8, "bold");
    cor("Text", COR.vermelho);
    doc.text(`EQUIPE  ·  ${indice + 1}º NO COMPARATIVO`, margem + 26, yy + 9);
    titulo(13.5);
    cor("Text", COR.preto);
    doc.text(doc.splitTextToSize(e.equipe, LARGURA_UTIL - 80)[0], margem + 26, yy + 15.5);
    texto(8.3);
    cor("Text", COR.textoMuted);
    doc.text(`Gestor responsável: ${ultima.gestorResponsavel || "-"}`, margem + 26, yy + 20.5);
    doc.text(
      `Última avaliação: ${formatPeriodo(ultima.periodo)}  ·  ${historico.length} ${historico.length === 1 ? "registro" : "registros"} no histórico`,
      margem + 26,
      yy + 25
    );

    // Caixa da nota geral
    const xNota = largura - margem - 44;
    cor("Fill", COR.preto);
    doc.roundedRect(xNota, yy + 3, 41, 24, 2, 2, "F");
    texto(6.3, "bold");
    cor("Text", COR.textoSobreEscuro);
    doc.text(`NOTA GERAL · ${formatPeriodo(ultima.periodo).toUpperCase()}`, xNota + 20.5, yy + 8.5, { align: "center" });
    titulo(19);
    cor("Text", COR.branco);
    doc.text(formatarNota(ultima.nota), xNota + 20.5, yy + 17.5, { align: "center" });
    texto(6.6, "bold");
    const tendencia = e.diff == null ? "PRIMEIRO REGISTRO" : `${formatDiferenca(e.diff).toUpperCase()} VS. ANTERIOR`;
    cor("Text", e.diff == null || Math.abs(e.diff) < 0.05 ? COR.textoSobreEscuro : e.diff > 0 ? [120, 205, 155] : [255, 110, 100]);
    doc.text(tendencia, xNota + 20.5, yy + 23, { align: "center" });
    yy += 30 + 10;

    // Indicadores do último período
    yy = tituloSecao(`Indicadores  ·  ${formatPeriodo(ultima.periodo)}`, yy) + 2;
    const anterior = historico[1];
    INDICADORES_EQUIPE.forEach((ind) => {
      const valor = Number(ultima.indicadores?.[ind.key]);
      const valorAnterior = Number(anterior?.indicadores?.[ind.key]);
      texto(8.3);
      cor("Text", COR.texto);
      doc.text(ind.label, margem, yy + 3.3);
      cor("Fill", COR.fundoSuave);
      doc.roundedRect(margem + larguraRotulo, yy, larguraBarraMax - 20, 4.6, 1.2, 1.2, "F");
      if (Number.isFinite(valor)) {
        cor("Fill", corDaNota(valor));
        doc.roundedRect(margem + larguraRotulo, yy, Math.max((valor / 5) * (larguraBarraMax - 20), 2.4), 4.6, 1.2, 1.2, "F");
      }
      texto(8.3, "bold");
      cor("Text", COR.preto);
      doc.text(Number.isFinite(valor) ? `${valor}/5` : "-", largura - margem - 20, yy + 3.3, { align: "right" });
      if (Number.isFinite(valor) && Number.isFinite(valorAnterior)) {
        const d = valor - valorAnterior;
        texto(7.3, "bold");
        cor("Text", d > 0 ? COR.verde : d < 0 ? COR.vermelho : COR.textoMuted);
        doc.text(d === 0 ? "=" : `${d > 0 ? "+" : ""}${d}`, largura - margem, yy + 3.3, { align: "right" });
      }
      yy += 7.4;
    });
    yy += 6;

    // Pontos de atenção + resumo do gestor
    const caixaTexto = (rotulo, conteudo, destaque) => {
      const linhas = doc.splitTextToSize(conteudo, LARGURA_UTIL - 10);
      texto(8.3);
      const alturaCaixa = 10 + linhas.length * 4;
      cor("Fill", destaque ? COR.vermelhoSuave : COR.fundoSuave);
      doc.roundedRect(margem, yy, LARGURA_UTIL, alturaCaixa, 2, 2, "F");
      cor("Fill", destaque ? COR.vermelho : COR.borda);
      doc.rect(margem, yy + 2.5, 1.1, alturaCaixa - 5, "F");
      texto(6.5, "bold");
      cor("Text", destaque ? COR.vermelhoEscuro : COR.textoMuted);
      doc.text(rotulo.toUpperCase(), margem + 5, yy + 5.5);
      texto(8.3);
      cor("Text", COR.texto);
      doc.text(linhas, margem + 5, yy + 10.5);
      yy += alturaCaixa + 4;
    };
    const pontos = ultima.pontosAtencao?.trim();
    caixaTexto("Pontos de atenção", pontos || "Nenhum ponto de atenção registrado.", Boolean(pontos));
    caixaTexto("Resumo do gestor para o RH", ultima.observacoes?.trim() || "-", false);
    yy += 4;

    // Evolução da nota geral (a partir de 2 períodos)
    const serie = [...historico].reverse().filter((h) => h.nota != null);
    if (serie.length >= 2) {
      yy = tituloSecao("Evolução da nota geral", yy) + 2;
      const alturaGrafico = 30;
      const xIni = margem + 8;
      const larguraGrafico = LARGURA_UTIL - 12;
      const px = (i) => xIni + (serie.length === 1 ? 0 : (i / (serie.length - 1)) * larguraGrafico);
      const py = (n) => yy + alturaGrafico - ((n - 1) / 4) * alturaGrafico;
      [1, 2, 3, 4, 5].forEach((n) => {
        cor("Draw", COR.borda);
        doc.setLineWidth(0.1);
        doc.line(xIni, py(n), xIni + larguraGrafico, py(n));
        texto(6.3);
        cor("Text", COR.textoMuted);
        doc.text(String(n), margem, py(n) + 1);
      });
      cor("Draw", COR.vermelho);
      doc.setLineWidth(0.6);
      serie.slice(1).forEach((h, i) => doc.line(px(i), py(serie[i].nota), px(i + 1), py(h.nota)));
      serie.forEach((h, i) => {
        cor("Fill", COR.branco);
        cor("Draw", COR.vermelho);
        doc.setLineWidth(0.5);
        doc.circle(px(i), py(h.nota), 1.1, "FD");
        texto(6.5, "bold");
        cor("Text", COR.preto);
        doc.text(formatarNota(h.nota), px(i), py(h.nota) - 2.4, { align: "center" });
        texto(6.3);
        cor("Text", COR.textoMuted);
        doc.text(formatPeriodo(h.periodo), px(i), yy + alturaGrafico + 5, { align: i === 0 ? "left" : i === serie.length - 1 ? "right" : "center" });
      });
      yy += alturaGrafico + 14;
    }

    // Histórico completo
    yy = tituloSecao("Histórico de avaliações", yy);
    tabela({
      startY: yy,
      head: [["Período", "Gestor", ...INDICADORES_EQUIPE.map((i) => ROTULO_CURTO[i.key] ?? i.label), "Nota", "Pontos de atenção"]],
      body: historico.map((h) => [
        formatPeriodo(h.periodo),
        h.gestorResponsavel || "-",
        ...INDICADORES_EQUIPE.map((ind) => h.indicadores?.[ind.key] ?? "-"),
        formatarNota(h.nota),
        h.pontosAtencao?.trim() || "-",
      ]),
      columnStyles: {
        0: { halign: "center", cellWidth: 20 },
        1: { cellWidth: 28 },
        2: { halign: "center", cellWidth: 12 },
        3: { halign: "center", cellWidth: 14 },
        4: { halign: "center", cellWidth: 19 },
        5: { halign: "center", cellWidth: 14 },
        6: { halign: "center", cellWidth: 13, fontStyle: "bold", textColor: COR.vermelho },
      },
      didParseCell: (d) => {
        if (d.section === "head" && d.column.index !== 1 && d.column.index !== 7) d.cell.styles.halign = "center";
      },
    });
  });

  pdf.finalizar({
    tituloCabecalho: "Gestão de Equipes",
    subtituloCabecalho: `Gerado em ${dataHoraAgora()}`,
    propriedades: {
      title: "Relatório de Gestão de Equipes",
      subject: "Avaliação de Equipes",
      author: geradoPor || "Grupo Maxpesa",
    },
    nomeArquivo: nomeArquivoPdf("relatorio-equipes"),
  });
}
