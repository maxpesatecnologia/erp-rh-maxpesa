// Nome oficial da filial é longo demais pra exibir nas telas; aqui só encurta
// pra exibição, o valor salvo no banco continua o nome completo.
export function formatFilial(filial) {
  if (!filial) return filial;
  if (filial.toUpperCase().startsWith("SARENS")) return "SARENS";
  return filial.toUpperCase();
}

export function formatMoeda(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatDataHora(isoDatetime) {
  if (!isoDatetime) return "—";
  const data = new Date(isoDatetime);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDiaMes(iso) {
  if (!iso) return "—";
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

// Diferença em dias (inteiro) entre hoje e a data informada (positivo = no futuro).
export function diasAte(iso) {
  if (!iso) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const [y, m, d] = iso.split("-").map(Number);
  const alvo = new Date(y, m - 1, d);
  return Math.round((alvo - hoje) / 86400000);
}

// Calcula a próxima ocorrência (este ano ou o próximo) do dia/mês de uma data de nascimento.
export function proximoAniversario(dataNascimentoIso) {
  if (!dataNascimentoIso) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const [, m, d] = dataNascimentoIso.split("-").map(Number);
  let alvo = new Date(hoje.getFullYear(), m - 1, d);
  if (alvo < hoje) alvo = new Date(hoje.getFullYear() + 1, m - 1, d);
  return { mes: m, dia: d, dias: Math.round((alvo - hoje) / 86400000) };
}
