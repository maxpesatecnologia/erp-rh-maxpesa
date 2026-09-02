# Maxpesa | ERP RH

Protótipo funcional (React + Vite + CSS puro) da plataforma de Gestão Estratégica de Pessoas da Maxpesa —
Dashboard Executivo, Cadastro de Colaboradores, Portal do Colaborador, Recrutamento & Seleção, Admissão Digital,
Treinamentos, Operadores de Equipamentos, Segurança do Trabalho, Medicina Ocupacional, Gestão de EPIs, Gestão de
Equipes (com bloqueio automático por pendência), Comunicação Interna e IA Corporativa.

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
| gestor       | gestor@maxpesa.com.br         | Todos, exceto Recrutamento e Admissão Digital                |
| colaborador  | colaborador@maxpesa.com.br    | Portal do Colaborador, Treinamentos, Comunicação, IA         |

A tela de login já mostra botões para preencher esses usuários automaticamente. O menu lateral exibe com um 🔒
os módulos que o perfil logado não pode acessar, e tentar abrir a URL de um módulo sem permissão mostra a tela
de "Acesso restrito" em vez do conteúdo.

Isso é só para você navegar e validar as telas. **Para produção, use o Supabase** (próxima seção) — é ele quem
vai garantir a segurança e a trava de acesso reais.

## Ligando o Supabase (autenticação + controle de acesso real)

1. Crie um projeto em https://supabase.com (grátis para começar).
2. Em **Project Settings → API**, copie a `Project URL` e a `anon public key`.
3. Copie `.env.example` para `.env` e preencha:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
4. No SQL Editor do Supabase, crie a tabela de perfis e as políticas de segurança (RLS):

   ```sql
   create table profiles (
     id uuid primary key references auth.users (id) on delete cascade,
     nome text not null,
     role text not null check (role in ('admin', 'rh', 'gestor', 'colaborador')),
     filial text
   );

   alter table profiles enable row level security;

   -- cada usuário pode ler o próprio perfil
   create policy "usuário lê o próprio perfil"
     on profiles for select
     using (auth.uid() = id);

   -- admin/rh podem ler todos os perfis (ajuste conforme a regra real da Maxpesa)
   create policy "admin e rh leem todos os perfis"
     on profiles for select
     using (
       exists (
         select 1 from profiles p
         where p.id = auth.uid() and p.role in ('admin', 'rh')
       )
     );
   ```

5. Crie os usuários em **Authentication → Users** (o app não tem tela de cadastro público) e depois insira a
   linha correspondente em `profiles` com o `role` de cada um. É essa linha em `profiles` que libera o acesso:
   sem ela, o login é recusado mesmo com e-mail/senha corretos (ver item abaixo).
6. Reinicie `npm run dev`. O app detecta o `.env` preenchido e passa a usar o Supabase de verdade — o modo demo
   é desativado automaticamente.

O front-end já está todo preparado para isso: veja `src/lib/supabaseClient.js` e `src/context/AuthContext.jsx`.
Cada módulo do menu (`src/config/modules.js`) já declara quais `roles` podem acessá-lo — é só ajustar essa lista
conforme a política de acesso definitiva da Maxpesa.

### Login restrito a e-mails pré-liberados

Não existe formulário de cadastro no app — só a tela de login. O controle de quem pode entrar funciona assim:

- **Modo demo:** só os 4 e-mails listados em `src/data/demoUsers.js` funcionam.
- **Modo Supabase:** o login exige uma conta em **Authentication → Users** *e* uma linha correspondente em
  `profiles`. Se alguém autenticar mas não tiver linha em `profiles` (ou seja, nunca foi provisionado pelo
  RH/administrador), o app encerra a sessão automaticamente e mostra "Este e-mail ainda não foi liberado para
  acessar o sistema." — mesmo que a senha esteja correta. Ou seja, `profiles` é a lista de e-mails autorizados.

## Sobre os dados das telas (hoje mockados, no formato do SharePoint)

Cada módulo lê dados de `src/data/mock/*.js`. Esses arquivos foram montados **no mesmo formato de colunas que
as planilhas do SharePoint da Maxpesa teriam** (ex.: `Cadastro_Colaboradores.xlsx`, `Controle_ASO.xlsx`,
`Estoque_e_Entregas.xlsx`), para que a troca por dados reais não exija redesenhar as telas — só troca a fonte.

### Próximo passo: ligar ao SharePoint de verdade

Isso precisa de um **registro de aplicativo no Azure AD / Microsoft Entra ID**, no tenant Microsoft 365 da
Maxpesa, com permissão de leitura ao Microsoft Graph API (`Sites.Read.All` ou `Files.Read.All`, dependendo do
escopo). Quem consegue gerar isso é o administrador do Microsoft 365 da Maxpesa. Assim que tiver:

- `Tenant ID`, `Client ID` e `Client Secret` do app registrado;
- a URL do site/pasta do SharePoint com as planilhas;

dá para escrever uma function (Supabase Edge Function, por exemplo — **nunca deixar o Client Secret no
front-end**) que lê a planilha via Microsoft Graph API e serve os dados para o front-end no lugar dos mocks em
`src/data/mock/`. A estrutura de dados já foi pensada para bater com esse formato.

Isso também vale, no mesmo padrão, para as demais integrações previstas na ideia original: Domínio Sistemas
(cadastro, admissões, férias, banco de horas), Active Directory/Entra ID, Microsoft 365, Power BI, RD Station,
Solides, relógio de ponto, WhatsApp Business, Outlook e Teams.

## Estrutura do projeto

```
src/
  components/     Sidebar, Topbar, Layout, ProtectedRoute, DataTable, StatusBadge
  context/         AuthContext (login, sessão, perfil)
  lib/             supabaseClient, motor de respostas da IA Corporativa
  config/modules.js  Lista de módulos do menu + quem pode acessar cada um
  data/mock/       Dados de exemplo por módulo (formato "planilha SharePoint")
  pages/           Uma pasta por módulo do sistema
```

## Próximos passos sugeridos

- [ ] Confirmar a paleta de cores/identidade visual definitiva da Maxpesa (hoje: navy + âmbar, estilo
      industrial/segurança do trabalho) e ajustar `src/index.css`.
- [ ] Criar o projeto Supabase real e a tabela `profiles` (passo a passo acima).
- [ ] Obter credenciais do Azure AD/Entra ID para a integração com SharePoint.
- [ ] Substituir os arquivos de `src/data/mock/` pelas chamadas reais (SharePoint / Domínio Sistemas / Supabase).
- [ ] Detalhar as regras de acesso por perfil em `src/config/modules.js` junto com o RH da Maxpesa.
