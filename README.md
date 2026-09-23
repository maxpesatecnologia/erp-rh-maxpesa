# Maxpesa | ERP RH

Plataforma de Gestão Estratégica de Pessoas da Maxpesa — protótipo funcional em **React + Vite + CSS puro**,
com **Supabase** como backend (autenticação, banco de dados e controle de acesso por perfil).

📘 **Documentação:**
[Manual do Usuário](MANUAL_DO_USUARIO.md) (como usar cada tela, para RH/gestores/colaboradores) ·
[Documentação técnica de backend](docs/BACKEND.md) (schema SQL, RLS, integrações)

## Funcionalidades

- **Dashboard Executivo** — indicadores de headcount, admissões/desligamentos, turnover, férias e afastamentos.
- **Cadastro de Colaboradores** — cadastro completo (dados pessoais, CNH, NRs, certificações, dependentes),
  importação em massa via Excel, desligamento guiado.
- **Recrutamento & Seleção** — funil (Kanban) de candidatos e banco de currículos por vaga.
- **Admissão Digital** — checklist de onboarding alimentado automaticamente pelo Recrutamento.
- **Documentos** — repositório de documentos pessoais obrigatórios e extras por colaborador.
- **Desligamento Digital** — checklist de offboarding (Kanban + visão de checklist), com importação em massa.
- **Gestão de Férias** — solicitação, aprovação, prorrogação e cálculo automático de saldo/férias vencidas (CLT).
- **Avaliação de Desempenho** — ciclos com metas, competências, autoavaliação, avaliação do gestor e PDI.
- **Competências** — consulta de qualificações (NRs, certificações, equipamentos, CNH) por colaborador.
- **Gestão de ASOs e Gestão de EPIs** — leitura integrada ao sistema externo EPI Controle.
- **Gestão de Equipes** — autoavaliação periódica de indicadores por time, com histórico comparável.
- **Comunicação Interna** — mural de comunicados, aniversariantes e férias da equipe.
- **IA Corporativa (Max)** — assistente de chat com escopo restrito a RH/DP (Google Gemini via Edge Function).
- **Logs de Auditoria** — histórico completo de criação/edição/exclusão, restrito ao perfil administrador.
- **Controle de acesso por perfil** — 4 perfis (admin, RH, gestor, colaborador), cada um com seu próprio recorte
  de módulos, aplicado tanto no menu quanto nas rotas.

Detalhes de uso de cada tela: veja o [Manual do Usuário](MANUAL_DO_USUARIO.md).

## Stack tecnológica

- [React 19](https://react.dev/) + [Vite](https://vite.dev/) + [React Router 7](https://reactrouter.com/)
- CSS puro (sem framework de UI)
- [Supabase](https://supabase.com/) (Postgres + Auth + Row Level Security + Edge Functions + Storage)
- [lucide-react](https://lucide.dev/) para ícones, [SheetJS/xlsx](https://sheetjs.com/) para importação/exportação Excel
- [Google Gemini API](https://ai.google.dev/) por trás da IA Corporativa

## Rodando o projeto

```bash
npm install
npm run dev
```

Abra http://localhost:5173. Você verá a tela de login.

## Modo demonstração (sem Supabase configurado)

Se o arquivo `.env` não existir (ou estiver vazio), o sistema entra automaticamente em **modo demo**: o login
aceita os usuários abaixo (senha `demo123` para todos), simulando os 4 perfis de acesso do sistema:

| Perfil       | E-mail                        | O que consegue acessar                                   |
|--------------|--------------------------------|------------------------------------------------------------|
| admin        | admin@maxpesa.com.br          | Todos os módulos                                            |
| rh           | rh@maxpesa.com.br             | Todos os módulos                                             |
| gestor       | gestor@maxpesa.com.br         | Todos, exceto Admissão Digital, Documentos, Desligamento, Férias e Auditoria |
| colaborador  | colaborador@maxpesa.com.br    | Acesso Rápido, Comunicação Interna e IA Corporativa          |

A tela de login já mostra botões para preencher esses usuários automaticamente. O menu lateral exibe com um 🔒
os módulos que o perfil logado não pode acessar, e tentar abrir a URL de um módulo sem permissão mostra a tela
de "Acesso restrito" em vez do conteúdo.

Isso é só para você navegar e validar as telas. **Para produção, use o Supabase** — é ele quem vai garantir a
segurança e a trava de acesso reais. Em modo demo, os dados ficam só em memória e somem ao recarregar a página.

## Ligando o Supabase (autenticação + controle de acesso real)

Passo a passo completo — criação do projeto, tabela `rh_profiles`, políticas de RLS e schema de cada módulo —
está em **[docs/BACKEND.md](docs/BACKEND.md)**. Resumo rápido:

1. Crie um projeto em https://supabase.com e copie `Project URL` + `anon public key` (**Project Settings → API**).
2. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Crie a tabela `rh_profiles` e as demais tabelas do sistema (SQL completo em `docs/BACKEND.md`).
4. Crie os usuários em **Authentication → Users** e a linha correspondente em `rh_profiles` — é ela que libera
   o acesso (o app não tem tela de cadastro público).
5. Reinicie `npm run dev`. O app detecta o `.env` preenchido e desativa o modo demo automaticamente.

## Estrutura do projeto

```
src/
  components/     Sidebar, Topbar, Layout, ProtectedRoute, DataTable, StatusBadge
  context/        AuthContext (login, sessão, perfil)
  lib/            supabaseClient, *Api.js (camada de dados por módulo), motor da IA Corporativa
  config/modules.js  Lista de módulos do menu + quem pode acessar cada um
  data/mock/      Dados de exemplo por módulo (formato "planilha SharePoint")
  pages/          Uma pasta por módulo do sistema
supabase/
  functions/ia-corporativa/  Edge Function que chama a API do Google Gemini por trás da IA Corporativa
```

Veja [docs/BACKEND.md](docs/BACKEND.md) para o detalhamento de cada módulo, as integrações previstas
(SharePoint, Domínio Sistemas, EPI Controle) e o roadmap técnico completo.
