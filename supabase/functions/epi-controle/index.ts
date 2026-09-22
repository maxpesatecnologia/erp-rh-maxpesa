// Supabase Edge Function — proxy seguro para a MAXPESA API
// (Controle de EPI & EPC, doc: MAXPESA-API.md).
//
// A URL da API é pública (documentada), mas a CHAVE de acesso nunca pode
// aparecer no front-end — ela vive só aqui, como secret do projeto Supabase:
//   npx supabase secrets set EPI_CONTROLE_API_KEY=SUA_CHAVE
//
// O front (src/lib/epiControleApi.js) chama esta function via
// supabase.functions.invoke("epi-controle", { body: { recurso, params } }),
// autenticado só com a anon key pública do Supabase. A chave real da MAXPESA
// API nunca trafega para o navegador do usuário.
//
// Esta function só repassa os dados crus (`{ data, pagination }`) de um dos
// recursos liberados abaixo — quem monta as telas (agrupar EPIs por
// colaborador, cruzar ASO com colaborador etc.) é o front, em
// src/lib/epiControleApi.js.

const MAXPESA_API_BASE = "https://ifrenpgoxgngnjrzbwqh.supabase.co/functions/v1/public-api";
const MAXPESA_API_KEY = Deno.env.get("EPI_CONTROLE_API_KEY");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Só estes recursos podem ser consultados — evita virar um proxy aberto para
// qualquer caminho da API.
const RECURSOS_PERMITIDOS = new Set([
  "colaboradores",
  "equipamentos",
  "estoque",
  "entregas",
  "devolucoes",
  "epcs",
  "fichas",
  "asos",
  "notas_fiscais",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ erro: "Método não permitido." }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!MAXPESA_API_KEY) {
    return new Response(
      JSON.stringify({ erro: "EPI_CONTROLE_API_KEY não configurada nos secrets do Supabase." }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const recurso = typeof body?.recurso === "string" ? body.recurso : "";

    if (!RECURSOS_PERMITIDOS.has(recurso)) {
      return new Response(JSON.stringify({ erro: `Recurso inválido: "${recurso}".` }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const params = body?.params && typeof body.params === "object" ? body.params : {};
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.offset) query.set("offset", String(params.offset));
    if (params.updated_since) query.set("updated_since", String(params.updated_since));

    const url = `${MAXPESA_API_BASE}/v1/${recurso}${query.toString() ? `?${query}` : ""}`;
    const resposta = await fetch(url, {
      headers: { Authorization: `Bearer ${MAXPESA_API_KEY}` },
    });

    const texto = await resposta.text();
    if (!resposta.ok) {
      return new Response(JSON.stringify({ erro: `MAXPESA API: HTTP ${resposta.status} — ${texto}` }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(texto, {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ erro: `Erro inesperado: ${(err as Error).message}` }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
