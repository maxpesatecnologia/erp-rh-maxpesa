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
   create table rh_profiles (
     id uuid primary key references auth.users (id) on delete cascade,
     nome text not null,
     role text not null check (role in ('admin', 'rh', 'gestor', 'colaborador')),
     filial text
   );

   alter table rh_profiles enable row level security;

   -- cada usuário pode ler o próprio perfil
   create policy "usuário lê o próprio perfil"
     on rh_profiles for select
     using (auth.uid() = id);

   -- admin/rh podem ler todos os perfis (ajuste conforme a regra real da Maxpesa)
   create policy "admin e rh leem todos os perfis"
     on rh_profiles for select
     using (
       exists (
         select 1 from rh_profiles p
         where p.id = auth.uid() and p.role in ('admin', 'rh')
       )
     );
   ```

5. Crie os usuários em **Authentication → Users** (o app não tem tela de cadastro público) e depois insira a
   linha correspondente em `rh_profiles` com o `role` de cada um. É essa linha em `rh_profiles` que libera o
   acesso: sem ela, o login é recusado mesmo com e-mail/senha corretos (ver item abaixo).
6. Reinicie `npm run dev`. O app detecta o `.env` preenchido e passa a usar o Supabase de verdade — o modo demo
   é desativado automaticamente.

O front-end já está todo preparado para isso: veja `src/lib/supabaseClient.js` e `src/context/AuthContext.jsx`.
Cada módulo do menu (`src/config/modules.js`) já declara quais `roles` podem acessá-lo — é só ajustar essa lista
conforme a política de acesso definitiva da Maxpesa.

### Admissão Digital é alimentada pelo Recrutamento

A tela de Admissão Digital não tem cadastro manual: uma admissão nasce quando o RH clica em **"Efetivar
contratação"** no card de um candidato que chegou na última etapa do pipeline de Recrutamento & Seleção
("Aprovação de Contratação"). Isso cria uma linha na tabela `rh_admissoes` com o checklist zerado, evitando
digitar o nome/vaga do candidato de novo.

Para isso funcionar com o Supabase real, crie a tabela (ajuste as políticas de RLS conforme o padrão que você já
usou em `rh_candidatos`):

```sql
create table rh_admissoes (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid references rh_candidatos (id) on delete set null,
  nome text not null,
  cargo text,
  filial text,
  data_prevista date,
  checklist jsonb not null default '{
    "dadosPessoais": false,
    "documentos": false,
    "exameAdmissional": false,
    "assinaturaContrato": false,
    "integracaoDominio": false
  }',
  created_at timestamptz not null default now()
);

alter table rh_admissoes enable row level security;

-- sem nenhuma policy, o Postgres nega até usuário autenticado — libere
-- leitura/escrita para admin e rh (mesmos papéis que já acessam o módulo)
create policy "admin e rh leem admissões"
  on rh_admissoes for select
  using (
    exists (
      select 1 from rh_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'rh')
    )
  );

create policy "admin e rh criam admissões"
  on rh_admissoes for insert
  with check (
    exists (
      select 1 from rh_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'rh')
    )
  );

create policy "admin e rh atualizam admissões"
  on rh_admissoes for update
  using (
    exists (
      select 1 from rh_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'rh')
    )
  );

create policy "admin e rh cancelam admissões"
  on rh_admissoes for delete
  using (
    exists (
      select 1 from rh_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'rh')
    )
  );
```

A tela permite cancelar uma admissão (botão "×" no card, com confirmação) — isso executa um `delete` na linha, então a policy de `delete` acima é obrigatória para o botão funcionar com o Supabase real.

Sem `.env` configurado (modo demo), a tela funciona do mesmo jeito, mas guarda as admissões só em memória
(`src/lib/admissaoApi.js`) — elas somem ao recarregar a página, só para dar para navegar o fluxo sem backend.

### Desligamento Digital é a lógica inversa da Admissão

Mesmo padrão da Admissão, só que "de trás para frente": o Desligamento Digital não tem cadastro manual, ele nasce
quando o RH clica em **"Desligar"** na linha de um colaborador ativo no Cadastro de Colaboradores. Isso cria uma
linha na tabela `rh_desligamentos` com o checklist de saída zerado e marca o colaborador como "Desligado".

```sql
create table rh_desligamentos (
  id uuid primary key default gen_random_uuid(),
  colaborador_id text not null, -- referencia rh_colaboradores.matricula
  motivo text,
  data_desligamento date,
  checklist jsonb not null default '{
    "entrevistaDesligamento": false,
    "devolucaoEquipamentos": false,
    "exameDemissional": false,
    "acertoRescisorio": false,
    "homologacaoSindicato": false,
    "baixaDominio": false
  }',
  created_at timestamptz not null default now()
);

alter table rh_desligamentos enable row level security;

create policy "admin e rh leem desligamentos"
  on rh_desligamentos for select
  using (
    exists (
      select 1 from rh_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'rh')
    )
  );

create policy "admin e rh criam desligamentos"
  on rh_desligamentos for insert
  with check (
    exists (
      select 1 from rh_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'rh')
    )
  );

create policy "admin e rh atualizam desligamentos"
  on rh_desligamentos for update
  using (
    exists (
      select 1 from rh_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'rh')
    )
  );

create policy "admin e rh cancelam desligamentos"
  on rh_desligamentos for delete
  using (
    exists (
      select 1 from rh_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'rh')
    )
  );
```

Sem `.env` configurado (modo demo), a tela funciona do mesmo jeito, mas guarda os desligamentos só em memória
(`src/lib/desligamentoApi.js`) — eles somem ao recarregar a página, só para dar para navegar o fluxo sem backend.

Clicar em "Desligar" também atualiza a coluna `status` do colaborador em `rh_colaboradores` para "Desligado"
(`atualizarStatusColaborador` em `src/lib/colaboradoresApi.js`). O botão "Cancelar desligamento" na tela de
Desligamento Digital reverte o processo por completo: apaga a linha em `rh_desligamentos` e volta o colaborador
para "Ativo" — útil quando o desligamento foi iniciado por engano.

### Avaliação de Desempenho (proposta em validação com a gestão)

Diferente de Admissão/Desligamento, aqui existe um cadastro manual: o RH/admin clica em **"Iniciar avaliação"**,
escolhe o colaborador e define as metas do ciclo (peso somando 100%) — a tabela padrão de competências entra
sozinha. A partir daí, quem tem acesso à tela lança as notas de 1 a 5 (autoavaliação e avaliação do gestor) e o
PDI; a nota final é sempre **calculada no front-end** (`src/lib/avaliacaoCalculo.js`), nunca gravada como número
solto — os pesos (30% autoavaliação / 70% gestor, 40% competências / 60% metas) são só o ponto de partida da
conversa com a gestão, ajuste as constantes desse arquivo quando os números forem validados.

```sql
create table rh_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  colaborador_id text not null, -- referencia rh_colaboradores.matricula
  ciclo text not null,
  status text not null default 'rascunho',
  competencias jsonb not null default '[]',
  metas jsonb not null default '[]',
  pdi jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table rh_avaliacoes enable row level security;

create policy "admin e rh leem avaliações"
  on rh_avaliacoes for select
  using (
    exists (
      select 1 from rh_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'rh')
    )
  );

create policy "gestor lê avaliações do próprio time"
  on rh_avaliacoes for select
  using (
    exists (
      select 1 from rh_profiles p
      join rh_colaboradores c on c.matricula = rh_avaliacoes.colaborador_id
      where p.id = auth.uid() and p.role = 'gestor' and c.gestor = p.nome
    )
  );

create policy "admin e rh criam avaliações"
  on rh_avaliacoes for insert
  with check (
    exists (
      select 1 from rh_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'rh')
    )
  );

create policy "admin e rh atualizam avaliações"
  on rh_avaliacoes for update
  using (
    exists (
      select 1 from rh_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'rh')
    )
  );

create policy "gestor atualiza avaliações do próprio time"
  on rh_avaliacoes for update
  using (
    exists (
      select 1 from rh_profiles p
      join rh_colaboradores c on c.matricula = rh_avaliacoes.colaborador_id
      where p.id = auth.uid() and p.role = 'gestor' and c.gestor = p.nome
    )
  );

create policy "admin e rh excluem avaliações"
  on rh_avaliacoes for delete
  using (
    exists (
      select 1 from rh_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'rh')
    )
  );
```

Sem `.env` configurado (modo demo), a tela funciona do mesmo jeito, mas guarda as avaliações só em memória
(`src/lib/avaliacaoApi.js`) — elas somem ao recarregar a página, só para dar para navegar o fluxo sem backend.

Hoje só `admin`, `rh` e `gestor` têm acesso à rota `/avaliacao-desempenho` (`src/config/modules.js`) — o
colaborador ainda não preenche a própria autoavaliação pelo Portal do Colaborador, então quem lança a nota
"Auto" também é o admin/RH (ex.: a partir de um formulário em papel/Forms). Se decidirem abrir a autoavaliação
para o colaborador preencher sozinho, isso vira uma tela nova no Portal do Colaborador, com uma policy de RLS
adicional restringindo cada um à própria linha (`colaborador_id` batendo com o perfil logado).

### Convenção de prefixo `rh_` (banco compartilhado entre sistemas)

O projeto Supabase pode acabar sendo compartilhado entre vários sistemas internos da Maxpesa, não só este ERP
de RH. Para evitar colisão de nomes e deixar claro de qual sistema é cada tabela, **toda tabela criada por este
app usa o prefixo `rh_`** — `rh_profiles`, e futuramente `rh_colaboradores`, `rh_treinamentos`,
`rh_desligamentos` etc. conforme cada módulo for migrado de `src/data/mock/` para dados reais. Ao criar uma
tabela nova para este sistema, mantenha o prefixo.

### Login restrito a e-mails pré-liberados

Não existe formulário de cadastro no app — só a tela de login. O controle de quem pode entrar funciona assim:

- **Modo demo:** só os 4 e-mails listados em `src/data/demoUsers.js` funcionam. É só um fallback para navegar
  pelas telas antes do Supabase estar pronto — some sozinho assim que o `.env` for preenchido com um projeto
  real (`isSupabaseConfigured` passa a `true`), sem precisar remover nada manualmente.
- **Modo Supabase:** o login exige uma conta em **Authentication → Users** *e* uma linha correspondente em
  `rh_profiles`. Se alguém autenticar mas não tiver linha em `rh_profiles` (ou seja, nunca foi provisionado
  pelo RH/administrador), o app encerra a sessão automaticamente e mostra "Este e-mail ainda não foi liberado
  para acessar o sistema." — mesmo que a senha esteja correta. Ou seja, `rh_profiles` é a lista de e-mails
  autorizados: ninguém entra por conta própria, só quem o RH/admin inserir lá.

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
- [ ] Criar o projeto Supabase real e a tabela `rh_profiles` (passo a passo acima).
- [ ] Obter credenciais do Azure AD/Entra ID para a integração com SharePoint.
- [ ] Substituir os arquivos de `src/data/mock/` pelas chamadas reais (SharePoint / Domínio Sistemas / Supabase).
- [ ] Detalhar as regras de acesso por perfil em `src/config/modules.js` junto com o RH da Maxpesa.
