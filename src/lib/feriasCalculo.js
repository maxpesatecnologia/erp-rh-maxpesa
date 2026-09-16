// Regras de férias da CLT usadas para calcular saldo — ver README (seção "Gestão de Férias")
// para a explicação completa. Resumo: cada 12 meses trabalhados (período aquisitivo) dão
// direito a 30 dias de férias, que devem ser gozados nos 12 meses seguintes (período
// concessivo). Passado o período concessivo sem gozo, as férias estão "vencidas".

export const DIAS_DIREITO_PERIODO = 30;
export const DIAS_MINIMOS_SOLICITACAO = 5;

function adicionarMeses(dataISO, meses) {
  const [y, m, d] = dataISO.split("-").map(Number);
  const data = new Date(y, m - 1 + meses, d);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

export function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Dias corridos entre duas datas ISO, incluindo o dia final (mesma regra usada no
// painel de autoatendimento — ver SolicitarFeriasPanel.jsx).
export function calcularDiasPeriodo(inicioISO, fimISO) {
  if (!inicioISO || !fimISO) return 0;
  const diff = (new Date(fimISO) - new Date(inicioISO)) / (1000 * 60 * 60 * 24);
  return diff > 0 ? diff + 1 : 0;
}

// Dias corridos entre duas datas ISO, SEM somar o dia final — usado para "há quantos
// dias venceu", que é uma contagem simples de intervalo, não um período de férias.
function diasEntre(inicioISO, fimISO) {
  return Math.round((new Date(fimISO) - new Date(inicioISO)) / (1000 * 60 * 60 * 24));
}

// Estimativa do valor a pagar em dobro pelas férias vencidas (art. 137 da CLT): o
// período inteiro não gozado dentro do prazo concessivo deve ser pago em dobro,
// incluindo o terço constitucional. É só uma ESTIMATIVA pro RH priorizar — validar
// com o financeiro/DP antes de qualquer cálculo de folha de pagamento de verdade.
export function calcularValorEstimadoDobro(salario, dias) {
  if (!salario || !dias) return 0;
  const valorDiaria = salario / 30;
  const valorFeriasComTerco = dias * valorDiaria * (4 / 3);
  return Math.round(valorFeriasComTerco * 2 * 100) / 100;
}

// Dias usados de UM período aquisitivo específico. A janela de uso vai do fim desse
// período (só se pode gozar depois de completar o aquisitivo) até o fim do período
// SEGUINTE (que é exatamente o fim do prazo concessivo) — janelas assim não se
// sobrepõem entre períodos vizinhos, então uma solicitação nunca é contada duas vezes.
function diasUsadosNoPeriodo(colaboradorId, solicitacoes, fimPeriodoISO, concessivoFimISO) {
  return solicitacoes
    .filter(
      (s) =>
        s.colaboradorId === colaboradorId &&
        s.status === "Aprovada" &&
        s.dataInicio >= fimPeriodoISO &&
        s.dataInicio < concessivoFimISO
    )
    .reduce((soma, s) => soma + s.dias, 0);
}

// Encontra o período aquisitivo mais recente já COMPLETO (12 meses fechados desde a
// admissão) — é esse que libera saldo para gozo. Retorna null se o colaborador ainda
// não completou os primeiros 12 meses de casa (sem saldo disponível ainda).
export function periodoAquisitivoAtual(admissaoISO, referenciaISO = hojeISO()) {
  if (!admissaoISO) return null;
  let ciclo = 0;
  while (adicionarMeses(admissaoISO, (ciclo + 1) * 12) <= referenciaISO) ciclo++;
  const indiceCompleto = ciclo - 1;
  if (indiceCompleto < 0) return null;

  const inicio = adicionarMeses(admissaoISO, indiceCompleto * 12);
  const fim = adicionarMeses(admissaoISO, (indiceCompleto + 1) * 12);
  const concessivoFim = adicionarMeses(fim, 12);
  return { indice: indiceCompleto, inicio, fim, concessivoInicio: fim, concessivoFim };
}

// Saldo de férias do colaborador no período aquisitivo atual, considerando os dias já
// aprovados dentro dele. `solicitacoes` é a lista completa de rh_ferias_solicitacoes.
//
// `colaborador.feriasAjusteDias` é um ajuste manual (RH) somado aos dias usados do
// período ATUAL — existe para cobrir a migração: gente que já está de férias ou já
// tirou dias antes deste módulo existir, sem solicitação registrada aqui ainda.
//
// `colaborador.feriasHistoricoOk`: como o cálculo de "vencidas" olha TODOS os períodos
// aquisitivos anteriores ao atual (não só o atual), colaborador antigo sem nenhuma
// solicitação lançada apareceria com anos de férias vencidas — mesmo tendo tirado
// férias normalmente antes deste sistema existir. Marcar esse flag zera o histórico
// (assume que tudo antes de hoje já foi gozado/regularizado) e passa a considerar só
// o período atual daqui pra frente. Ver README ("ajuste manual de saldo").
export function calcularSaldoFerias(colaborador, solicitacoes, referenciaISO = hojeISO()) {
  const ajusteDias = Number(colaborador?.feriasAjusteDias) || 0;
  const ajusteMotivo = colaborador?.feriasAjusteMotivo || "";
  const historicoOk = Boolean(colaborador?.feriasHistoricoOk);
  const periodo = periodoAquisitivoAtual(colaborador?.admissao, referenciaISO);

  if (!periodo) {
    // Sem período aquisitivo completo ainda (menos de 12 meses de casa) — só abre
    // saldo aqui se o RH configurou um ajuste manual explicitamente.
    if (!ajusteDias) {
      return {
        temPeriodoDisponivel: false,
        diasDireito: DIAS_DIREITO_PERIODO,
        diasUsados: 0,
        diasDisponiveis: 0,
        periodoAquisitivo: null,
        periodoConcessivo: null,
        vencidas: false,
        diasVencidos: 0,
        diasEmAtraso: 0,
        valorEstimadoDobro: 0,
        ajusteDias: 0,
        ajusteMotivo: "",
        historicoOk,
      };
    }
    return {
      temPeriodoDisponivel: true,
      diasDireito: DIAS_DIREITO_PERIODO,
      diasUsados: ajusteDias,
      diasDisponiveis: Math.max(0, DIAS_DIREITO_PERIODO - ajusteDias),
      periodoAquisitivo: null,
      periodoConcessivo: null,
      vencidas: false,
      diasVencidos: 0,
      diasEmAtraso: 0,
      valorEstimadoDobro: 0,
      ajusteDias,
      ajusteMotivo,
      historicoOk,
    };
  }

  const diasUsadosAutomaticos = diasUsadosNoPeriodo(colaborador.id, solicitacoes, periodo.fim, periodo.concessivoFim);
  const diasUsados = diasUsadosAutomaticos + ajusteDias;
  const diasDisponiveis = Math.max(0, DIAS_DIREITO_PERIODO - diasUsados);

  // O período "atual" (o mais recente já completo) NUNCA está vencido por
  // construção — ele só vira "atual" enquanto ainda está dentro do próprio prazo
  // concessivo. Quem pode estar vencido são os períodos aquisitivos ANTERIORES a
  // esse, cujo prazo concessivo já necessariamente passou (ver README). Somamos os
  // dias não gozados de todos eles.
  let diasVencidos = 0;
  let periodoVencidoMaisAntigo = null;
  if (!historicoOk) {
    for (let i = 0; i < periodo.indice; i++) {
      const fimI = adicionarMeses(colaborador.admissao, (i + 1) * 12);
      const concessivoFimI = adicionarMeses(fimI, 12);
      const usadosI = diasUsadosNoPeriodo(colaborador.id, solicitacoes, fimI, concessivoFimI);
      const naoGozadosI = Math.max(0, DIAS_DIREITO_PERIODO - usadosI);
      if (naoGozadosI > 0) {
        diasVencidos += naoGozadosI;
        if (!periodoVencidoMaisAntigo) periodoVencidoMaisAntigo = { concessivoFim: concessivoFimI };
      }
    }
  }

  const vencidas = diasVencidos > 0;
  const diasEmAtraso = vencidas ? diasEntre(periodoVencidoMaisAntigo.concessivoFim, referenciaISO) : 0;
  const valorEstimadoDobro = vencidas ? calcularValorEstimadoDobro(colaborador?.salario, diasVencidos) : 0;

  return {
    temPeriodoDisponivel: true,
    diasDireito: DIAS_DIREITO_PERIODO,
    diasUsados,
    diasDisponiveis,
    periodoAquisitivo: { inicio: periodo.inicio, fim: periodo.fim },
    periodoConcessivo: { inicio: periodo.concessivoInicio, fim: periodo.concessivoFim },
    vencidas,
    diasVencidos,
    diasEmAtraso,
    valorEstimadoDobro,
    ajusteDias,
    ajusteMotivo,
    historicoOk,
  };
}

// Status de exibição de uma solicitação já aprovada (para Kanban/listas), independente
// do status de aprovação em si — usado tanto na Gestão de Férias quanto no widget
// "Férias da equipe" da Comunicação Interna.
export function statusGozoFerias(dataInicioISO, dataFimISO, referenciaISO = hojeISO()) {
  if (referenciaISO > dataFimISO) return "Concluída";
  if (referenciaISO >= dataInicioISO) return "Em andamento";
  return "Agendada";
}
