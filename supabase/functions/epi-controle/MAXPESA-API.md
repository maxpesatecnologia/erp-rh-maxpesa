# MAXPESA API — documentação de integração

API REST somente leitura para consultar os dados do MAXPESA Controle de EPI & EPC.

## Endpoint base

```text
https://ifrenpgoxgngnjrzbwqh.supabase.co/functions/v1/public-api
```

## Autenticação

Envie a chave secreta em uma destas formas:

```http
Authorization: Bearer SUA_CHAVE
```

ou

```http
x-api-key: SUA_CHAVE
```

Nunca coloque a chave em sites, aplicativos móveis ou código executado no navegador. Use-a apenas no servidor do sistema integrado.

## Endpoints

| Método | Caminho | Conteúdo |
|---|---|---|
| GET | `/health` | Estado da API |
| GET | `/openapi.json` | Especificação OpenAPI 3.0 |
| GET | `/v1/colaboradores` | Colaboradores ativos e inativos |
| GET | `/v1/equipamentos` | EPIs e EPCs cadastrados |
| GET | `/v1/estoque` | Movimentações de estoque |
| GET | `/v1/entregas` | Entregas de EPI |
| GET | `/v1/devolucoes` | Devoluções de EPI |
| GET | `/v1/epcs` | Instalações de EPC |
| GET | `/v1/fichas` | Fichas eletrônicas e assinaturas |
| GET | `/v1/asos` | Exames ocupacionais |
| GET | `/v1/notas_fiscais` | Notas fiscais |
| GET | `/v1/{recurso}/{id}` | Um registro pelo identificador UUID |

## Paginação e atualização incremental

As listagens aceitam:

- `limit`: de 1 a 500; padrão 100.
- `offset`: posição inicial; padrão 0.
- `updated_since`: data e hora ISO 8601, apenas nos recursos que possuem `updated_at`.

Exemplo:

```text
/v1/colaboradores?limit=100&offset=0&updated_since=2026-09-01T00:00:00Z
```

Resposta:

```json
{
  "data": [],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 0,
    "has_more": false
  }
}
```

## Exemplos

### cURL

```bash
curl "https://ifrenpgoxgngnjrzbwqh.supabase.co/functions/v1/public-api/v1/colaboradores?limit=100" \
  -H "Authorization: Bearer SUA_CHAVE"
```

### JavaScript no servidor

```js
const response = await fetch(
  "https://ifrenpgoxgngnjrzbwqh.supabase.co/functions/v1/public-api/v1/equipamentos?limit=100",
  { headers: { Authorization: `Bearer ${process.env.MAXPESA_API_KEY}` } }
);
if (!response.ok) throw new Error(await response.text());
const result = await response.json();
```

## Erros

- `400`: parâmetro inválido.
- `401`: chave ausente ou inválida.
- `404`: endpoint ou registro inexistente.
- `405`: método diferente de GET.
- `500`: falha interna de consulta.
- `503`: chave da integração ainda não configurada.
