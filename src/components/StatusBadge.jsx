const MAP = {
  válido: "success",
  valido: "success",
  ativo: "success",
  aprovado: "success",
  em_dia: "success",
  concluido: "success",
  concluído: "success",

  vencendo: "warning",
  pendente: "warning",
  em_andamento: "warning",
  aguardando: "warning",

  vencido: "danger",
  bloqueado: "danger",
  reprovado: "danger",
  inapto: "danger",
  atrasado: "danger",
  erro: "danger",

  informativo: "info",
  novo: "info",
};

export default function StatusBadge({ status }) {
  const key = String(status).toLowerCase().replace(/\s+/g, "_");
  const variant = MAP[key] ?? "neutral";
  return <span className={`badge badge-${variant}`}>{status}</span>;
}
