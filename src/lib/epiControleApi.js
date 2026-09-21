import { ASOS_EXTERNOS, COLABORADORES_EPI } from "../data/mock/epiControleExterno";

const BASE_URL = import.meta.env.VITE_EPI_CONTROLE_API_URL;
const API_KEY = import.meta.env.VITE_EPI_CONTROLE_API_KEY;

export const epiControleConfigured = Boolean(BASE_URL);

async function requisitar(caminho) {
  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {},
  });
  if (!resposta.ok) {
    throw new Error(`Falha ao consultar o EPI Controle (HTTP ${resposta.status}).`);
  }
  return resposta.json();
}

// Sem a API configurada, devolve os dados de exemplo com uma pequena demora
// simulada — assim a tela de "Atualizar" já funciona de ponta a ponta hoje, e
// quando VITE_EPI_CONTROLE_API_URL entrar no .env passa a bater na API real
// sem precisar tocar nas telas.
function comDados(dados) {
  return new Promise((resolve) => setTimeout(() => resolve(dados), 500));
}

export async function listarAsosExternos() {
  if (!epiControleConfigured) return comDados(ASOS_EXTERNOS);
  return requisitar("/api/asos");
}

export async function listarEpisPorColaborador() {
  if (!epiControleConfigured) return comDados(COLABORADORES_EPI);
  return requisitar("/api/epis-por-colaborador");
}
