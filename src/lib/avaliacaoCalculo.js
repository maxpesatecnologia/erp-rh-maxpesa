// Lógica de cálculo da Avaliação de Desempenho — regras a validar com a gestão:
// - Escala de 1 a 5 em todos os itens (competências e metas).
// - Autoavaliação do colaborador + avaliação do gestor, com o gestor pesando mais.
// - Nota final = bloco de competências + bloco de metas, cada bloco com peso próprio
//   e cada item dentro do bloco com peso próprio (peso soma 100 dentro do bloco).
// - A nota de um bloco só fecha quando o gestor avaliou todos os itens dele —
//   autoavaliação sozinha não fecha a nota final.

export const ESCALA_MIN = 1;
export const ESCALA_MAX = 5;

export const PESO_AUTOAVALIACAO = 0.3;
export const PESO_GESTOR = 0.7;

export const PESO_BLOCO_COMPETENCIAS = 0.4;
export const PESO_BLOCO_METAS = 0.6;

export function calcularNotaItem(item) {
  if (item.gestor == null) return null;
  if (item.autoavaliacao == null) return item.gestor;
  return item.autoavaliacao * PESO_AUTOAVALIACAO + item.gestor * PESO_GESTOR;
}

export function calcularNotaBloco(itens) {
  if (!itens?.length) return null;
  const pesoTotal = itens.reduce((soma, item) => soma + item.peso, 0);
  if (!pesoTotal) return null;

  let somaPonderada = 0;
  for (const item of itens) {
    const nota = calcularNotaItem(item);
    if (nota == null) return null;
    somaPonderada += nota * item.peso;
  }
  return somaPonderada / pesoTotal;
}

export function calcularNotaFinal(avaliacao) {
  const notaCompetencias = calcularNotaBloco(avaliacao.competencias);
  const notaMetas = calcularNotaBloco(avaliacao.metas);
  if (notaCompetencias == null || notaMetas == null) return null;
  return notaCompetencias * PESO_BLOCO_COMPETENCIAS + notaMetas * PESO_BLOCO_METAS;
}

const FAIXAS_CONCEITO = [
  { min: 4.5, label: "Excepcional" },
  { min: 3.5, label: "Acima do esperado" },
  { min: 2.5, label: "Dentro do esperado" },
  { min: 1.5, label: "Abaixo do esperado" },
  { min: 0, label: "Insatisfatório" },
];

export function conceitoDaNota(nota) {
  if (nota == null) return null;
  return FAIXAS_CONCEITO.find((faixa) => nota >= faixa.min)?.label ?? null;
}

export function formatarNota(nota) {
  return nota == null ? "—" : nota.toFixed(1).replace(".", ",");
}
