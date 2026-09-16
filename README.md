# Maxpesa | ERP RH

Protótipo funcional (React + Vite + CSS puro) da plataforma de Gestão Estratégica de Pessoas da Maxpesa —
Dashboard Executivo, Cadastro de Colaboradores, Portal do Colaborador, Recrutamento & Seleção, Admissão Digital,
Documentos, Treinamentos, Operadores de Equipamentos, Segurança do Trabalho, Medicina Ocupacional, Gestão de
EPIs, Gestão de Equipes (com bloqueio automático por pendência), Comunicação Interna e IA Corporativa.

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

### Aba Documentos: repositório de documentos por colaborador

A aba **Documentos** lista todos os colaboradores e, em "Ver documentos", mostra os mesmos documentos pessoais
obrigatórios da Admissão Digital (`DOCUMENTOS_PESSOAIS_ADMISSAO` em `src/lib/admissaoApi.js`) para aquele
colaborador — permitindo anexar/remover a qualquer momento, mesmo depois do cadastro pronto. Além dos
obrigatórios, o RH pode digitar um nome e clicar em **"Criar documento"** dentro do modal para adicionar um
documento extra específico daquele colaborador (ex.: "Atestado médico", "Termo de confidencialidade") — ele
aparece na lista dali em diante, com seu próprio botão de anexar, e pode ser excluído por completo (ícone ao
lado do anexo) caso tenha sido criado por engano. Documentos obrigatórios não podem ser excluídos, só
anexados/removidos.

Um dos obrigatórios, **"Documento do dependente"**, é `multiplo: true` — em vez de um único anexo, aceita
vários arquivos no mesmo item (botão "Anexar outro"), pra cobrir o caso de mais de um dependente sem precisar
de um item de checklist por pessoa. Qualquer documento pode virar `multiplo` bastando marcar a flag em
`DOCUMENTOS_PESSOAIS_ADMISSAO` — o resto (contagem de anexados, upload, remoção por item) já lida com isso
tanto na Admissão Digital quanto na aba Documentos (ver `documentoEhMultiplo` em `src/lib/admissaoApi.js`).

Um colaborador criado a partir do **"Cadastro oficial"** da Admissão Digital já chega com os documentos que
foram anexados durante o checklist de admissão (ver `handleCadastroOficial` em
`src/pages/admissao/AdmissaoDigital.jsx`). Colaboradores cadastrados antes dessa integração — ou importados em
massa — começam com a coluna vazia e ficam disponíveis para o RH atribuir os documentos manualmente pela aba.

A coluna `documentos` guarda um objeto `{ anexos, extras }`: `anexos` é o mapa chave → arquivo (obrigatórios e
extras usam o mesmo mapa), `extras` é a lista de documentos extras criados manualmente (`{ chave, label }`) —
ver `src/pages/documentos/Documentos.jsx`.

Para funcionar com o Supabase real, adicione a coluna `documentos` à tabela `rh_colaboradores`:

```sql
alter table rh_colaboradores add column if not exists documentos jsonb not null default '{"anexos": {}, "extras": []}';
```

Sem `.env` configurado (modo demo), a aba funciona do mesmo jeito, mas as alterações ficam só em memória
(`src/pages/documentos/Documentos.jsx`) — somem ao recarregar a página.

### Dependentes nomeados no Cadastro de Colaboradores

O campo "Dependentes" do formulário de colaborador (`src/pages/colaboradores/NovoColaboradorForm.jsx`) não é
mais uma quantidade solta: é uma lista de nomes, um campo por dependente, com um botão **"+ Adicionar
dependente"** para incluir mais um e um "×" para remover. A contagem salva em `dependentes` é sempre calculada
a partir dessa lista (nunca digitada direto). Colaboradores antigos que só tinham a contagem aparecem com essa
quantidade de campos em branco, prontos para o RH preencher os nomes retroativamente.

Para funcionar com o Supabase real, adicione a coluna `dependentes_nomes` à tabela `rh_colaboradores`:

```sql
alter table rh_colaboradores add column if not exists dependentes_nomes text[] not null default '{}';
```

### Desligamento Digital é a lógica inversa da Admissão

Mesmo padrão da Admissão, só que "de trás para frente": o Desligamento Digital não tem cadastro manual, ele nasce
quando o RH clica em **"Desligar"** na linha de um colaborador ativo no Cadastro de Colaboradores. Isso cria uma
linha na tabela `rh_desligamentos` com o checklist de saída zerado e marca o colaborador como "Desligado".

A tela abre em **Kanban** por padrão: cada coluna é uma etapa do checklist (Entrevista → Devolução de equipamentos
→ Exame demissional → Acerto rescisório), mais uma coluna final "Concluído". O colaborador só aparece na aba
**Checklist** depois de passar por todas as etapas do Kanban e o RH clicar em "Enviar para o checklist" na coluna
"Concluído" (`em_checklist` vira `true`) — mesmo padrão do botão "Efetivar contratação" do Kanban de Recrutamento.
Clicando em qualquer card do Kanban abre um campo de observação livre (`observacao`), salvo por colaborador.

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
    "acertoRescisorio": false
  }',
  em_checklist boolean not null default false,
  observacao text,
  created_at timestamptz not null default now()
);

-- Se a tabela já existia antes dessas colunas:
-- alter table rh_desligamentos add column if not exists em_checklist boolean not null default false;
-- alter table rh_desligamentos add column if not exists observacao text;

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

### Gestão de Férias

Diferente de Admissão/Desligamento, aqui existe um cadastro manual: o RH clica em **"Solicitar férias"**, escolhe
o colaborador e o período — igual ao "Iniciar avaliação" da Avaliação de Desempenho. O saldo de dias disponíveis
é **sempre calculado no front-end** (`src/lib/feriasCalculo.js`), nunca gravado como número solto: a cada 12 meses
trabalhados desde a admissão (período aquisitivo) o colaborador tem direito a 30 dias, a gozar nos 12 meses
seguintes (período concessivo). Passado o período concessivo sem gozo, o saldo aparece marcado como "Vencidas" na
aba **Saldo de férias**.

O fluxo de aprovação é de uma etapa só: toda solicitação nasce "Pendente" e só o RH aprova ou recusa (recusar exige
motivo). Uma solicitação já **Aprovada** pode ser **prorrogada** — o RH define uma nova data de término e o motivo;
o período/dias anteriores ficam guardados no histórico (`prorrogacoes`, dentro da própria linha) e a solicitação
segue aprovada com a data nova. Também dá para **cancelar** uma aprovação (ex.: colaborador desistiu).

```sql
create table rh_ferias_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  colaborador_id text not null, -- referencia rh_colaboradores.matricula
  periodo_aquisitivo_inicio date not null,
  periodo_aquisitivo_fim date not null,
  data_inicio date not null,
  data_fim date not null,
  dias integer not null,
  status text not null default 'Pendente', -- Pendente | Aprovada | Recusada | Cancelada
  observacao_colaborador text,
  observacao_rh text,
  prorrogacoes jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table rh_ferias_solicitacoes enable row level security;

create policy "admin e rh leem ferias"
  on rh_ferias_solicitacoes for select
  using (
    exists (
      select 1 from rh_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'rh')
    )
  );

create policy "admin e rh criam ferias"
  on rh_ferias_solicitacoes for insert
  with check (
    exists (
      select 1 from rh_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'rh')
    )
  );

create policy "admin e rh atualizam ferias"
  on rh_ferias_solicitacoes for update
  using (
    exists (
      select 1 from rh_profiles p
      where p.id = auth.uid() and p.role in ('admin', 'rh')
    )
  );
```

Sem `.env` configurado (modo demo), a tela funciona do mesmo jeito, mas guarda as solicitações só em memória
(`src/lib/feriasApi.js`) — somem ao recarregar a página, só para dar para navegar o fluxo sem backend.

O widget "Férias da equipe" da Comunicação Interna (`src/pages/comunicacao/ComunicacaoInterna.jsx`) já usa essas
mesmas solicitações aprovadas quando o Supabase está configurado — só cai no mock `FERIAS_EQUIPE` em modo demo.

#### Ajuste manual de saldo (temporário, pra migração)

Como o módulo é novo, tem gente que já está de férias (ou já tirou dias) sem nenhuma solicitação lançada aqui —
o cálculo automático mostraria saldo cheio pra essas pessoas. Pra cobrir isso, a aba **Saldo de férias** tem um
botão **"Ajustar saldo"** por colaborador: o RH informa quantos dias somar aos "usados" (e o motivo), e isso entra
direto na conta em `feriasCalculo.js` — sem precisar reconstruir a solicitação retroativa. É pra ser temporário:
depois que o histórico real estiver lançado como solicitações de verdade, zere o ajuste de volta a 0.

```sql
alter table rh_colaboradores add column if not exists ferias_ajuste_dias integer not null default 0;
alter table rh_colaboradores add column if not exists ferias_ajuste_motivo text;
```

#### Cálculo de férias atrasadas (vencidas) e o "histórico zerado"

A aba **Saldo de férias** também calcula automaticamente as **férias atrasadas**: pela CLT, se o período aquisitivo
anterior ao atual não foi todo gozado dentro do seu prazo concessivo, aqueles dias ficam vencidos e devem ser pagos
em dobro (art. 137). Isso aparece destacado no topo da aba, com colaborador, há quantos dias venceu, dias não
gozados e uma **estimativa** de valor em dobro (`calcularValorEstimadoDobro` em `feriasCalculo.js` — dias × 1/3
constitucional × 2; é só uma estimativa pro RH priorizar, confirme com o financeiro/DP antes de usar em folha).

Isso olha **todos** os períodos aquisitivos anteriores ao atual, não só o mais recente — então um colaborador
antigo, sem nenhuma solicitação lançada aqui (porque tirou férias normalmente antes deste sistema existir), vai
aparecer com anos de "férias vencidas" por pura falta de registro, não porque isso realmente aconteceu. Pra esse
caso, o mesmo modal **"Ajustar saldo"** tem um checkbox **"Sem pendência de férias de anos anteriores"** — marcar
ele zera essa checagem de histórico pra aquele colaborador (`ferias_historico_ok`), e o cálculo passa a considerar
só o período aquisitivo atual dali pra frente.

```sql
alter table rh_colaboradores add column if not exists ferias_historico_ok boolean not null default false;
```

Os painéis de autoatendimento do colaborador no Portal (`SolicitarFeriasPanel.jsx` / `SaldoFeriasPanel.jsx`) ainda
**não** foram conectados a essa tabela: eles dependem de existir um vínculo entre o usuário autenticado (`rh_profiles`)
e sua matrícula em `rh_colaboradores`, que hoje não existe em nenhum módulo do Portal — é um pré-requisito maior,
compartilhado com os outros painéis de autoatendimento (dados cadastrais, banco de horas etc.), não só o de férias.

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
