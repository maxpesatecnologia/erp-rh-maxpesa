# Manual do Usuário — Maxpesa | ERP RH

Guia de uso do sistema de Gestão Estratégica de Pessoas da Maxpesa, voltado para quem usa o dia a dia:
RH, gestores e colaboradores. Para informações técnicas de instalação/configuração, veja o [README.md](README.md).

## Índice

1. [Acessando o sistema](#1-acessando-o-sistema)
2. [Perfis de acesso — o que cada um pode ver](#2-perfis-de-acesso--o-que-cada-um-pode-ver)
3. [Dashboard Executivo](#3-dashboard-executivo)
4. [Acesso Rápido](#4-acesso-rápido)
5. [Cadastro de Colaboradores](#5-cadastro-de-colaboradores)
6. [Recrutamento & Seleção](#6-recrutamento--seleção)
7. [Admissão Digital](#7-admissão-digital)
8. [Documentos](#8-documentos)
9. [Desligamento Digital](#9-desligamento-digital)
10. [Gestão de Férias](#10-gestão-de-férias)
11. [Avaliação de Desempenho](#11-avaliação-de-desempenho)
12. [Competências](#12-competências)
13. [Gestão de ASOs](#13-gestão-de-asos)
14. [Gestão de EPIs](#14-gestão-de-epis)
15. [Gestão de Equipes](#15-gestão-de-equipes)
16. [Comunicação Interna](#16-comunicação-interna)
17. [IA Corporativa (Max)](#17-ia-corporativa-max)
18. [Logs de Auditoria](#18-logs-de-auditoria)
19. [Perguntas frequentes](#19-perguntas-frequentes)

---

## 1. Acessando o sistema

Abra o endereço do sistema no navegador. A tela inicial é o **Login**:

- Informe seu e-mail corporativo e senha e clique em **Entrar**.
- O ícone de olho no campo de senha mostra/oculta o que foi digitado.
- Esqueceu a senha? Clique em **"Esqueci minha senha"** — o sistema sempre mostra a mesma mensagem de
  confirmação (por segurança, ele não informa se aquele e-mail existe ou não). Siga o link enviado por
  e-mail para cadastrar uma nova senha.
- Não existe cadastro público: sua conta é criada pelo RH/administrador. Se o login for recusado com a
  mensagem "Este e-mail ainda não foi liberado para acessar o sistema", procure o RH.

> **Modo demonstração:** em ambientes de teste (sem um banco de dados real configurado), a tela de login
> mostra botões de atalho para entrar como admin, RH, gestor ou colaborador. Isso é só para navegação e
> validação das telas — nada digitado nesse modo fica salvo depois de recarregar a página.

## 2. Perfis de acesso — o que cada um pode ver

O sistema tem 4 perfis. O menu lateral mostra todos os módulos, mas os que o seu perfil não pode abrir
aparecem com um cadeado 🔒 (só a tela de **Logs de Auditoria** fica totalmente escondida para quem não é
administrador).

| Módulo                        | Administrador | RH | Gestor | Colaborador |
|--------------------------------|:---:|:---:|:---:|:---:|
| Dashboard Executivo             | ✅ | ✅ | ✅ | — |
| Acesso Rápido                   | ✅ | ✅ | ✅ | ✅ |
| Cadastro de Colaboradores        | ✅ | ✅ | ✅ | — |
| Recrutamento & Seleção           | ✅ | ✅ | ✅ | — |
| Admissão Digital                 | ✅ | ✅ | — | — |
| Documentos                       | ✅ | ✅ | — | — |
| Desligamento Digital             | ✅ | ✅ | — | — |
| Gestão de Férias                 | ✅ | ✅ | — | — |
| Avaliação de Desempenho          | ✅ | ✅ | ✅* | — |
| Competências                     | ✅ | ✅ | ✅ | — |
| Gestão de ASOs                   | ✅ | ✅ | ✅ | — |
| Gestão de EPIs                   | ✅ | ✅ | ✅ | — |
| Gestão de Equipes                | ✅ | ✅ | ✅ | — |
| Comunicação Interna              | ✅ | ✅ | ✅ | ✅ |
| IA Corporativa (Max)             | ✅ | ✅ | ✅ | ✅ |
| Logs de Auditoria                | ✅ | — | — | — |

\* O gestor só visualiza e avalia as avaliações dos colaboradores que têm ele como "Gestor" no cadastro.

Hoje o perfil **colaborador** tem acesso apenas a Acesso Rápido, Comunicação Interna e IA Corporativa — um
portal de autoatendimento mais completo (dados cadastrais, solicitar férias, banco de horas etc.) está
planejado, mas ainda não está disponível nesta versão.

## 3. Dashboard Executivo

Tela inicial (`/`) para admin, RH e gestor — visão consolidada dos indicadores de pessoas.

- **Filtro de período**: escolha mês e ano no topo, ou clique em **"Todos"** para ver o total histórico.
  "Limpar filtro" volta para o mês atual.
- **Cartões de indicadores**: Colaboradores Ativos, Admitidos no mês, Desligados no mês, Departamentos —
  cada um com uma seta indicando se subiu ou desceu em relação ao período anterior.
- **Gráficos**: evolução do headcount, admissões x desligamentos (últimos 6 meses) e headcount por filial.
- **Composição da força de trabalho**: proporção entre Ativos, em Férias e Afastados no momento.
- **Indicadores por filial**: headcount e turnover (%) de cada filial, com selo colorido (verde ≤10%,
  amarelo ≤25%, vermelho acima disso).
- **Ativos por departamento**: quantidade de colaboradores em cada departamento.
- **Férias**: alterna entre "Programadas" (férias aprovadas que ainda vão acontecer ou estão em curso) e
  "Atrasadas" (férias vencidas, que precisam de atenção do RH).
- **Afastamentos ativos**: lista de quem está com status "Afastado" no momento.

## 4. Acesso Rápido

Tela (`/portal`) disponível para todos os perfis — uma central de atalhos. Mostra, em forma de cartões
clicáveis, apenas os módulos que o seu perfil pode acessar, agrupados da mesma forma que o menu lateral.
Clicar em um cartão leva direto para aquele módulo.

## 5. Cadastro de Colaboradores

Cadastro mestre de todos os colaboradores (dados pessoais, cargo, documentos de habilitação — CNH, NRs,
certificações, equipamentos). Acesso: admin, RH e gestor.

### Consultar e filtrar
- Use a busca (nome, cargo, código Domínio ou matrícula), o filtro por Filial/Status e o "Ordenar por" para
  localizar um colaborador. "Limpar filtros" reaparece assim que algum filtro estiver ativo.
- Clique em **"Ver timeline"** na linha do colaborador para ver, sem sair da tela, dados complementares
  (departamento, centro de custo, gestor, dependentes, CPF, telefone, e-mail) e uma linha do tempo com a
  data de admissão, CNH, NRs, certificações e equipamentos habilitados.
- O selo **"Editado por Fulano · dd/mm/aaaa hh:mm"** mostra quem fez a última alteração; clicar nele abre o
  histórico completo daquele registro.

### Cadastrar um novo colaborador
1. Clique em **"Novo colaborador"** — um formulário abre no topo da página.
2. Preencha os campos obrigatórios (marcados com \*): nome, código Domínio, cargo, departamento, filial,
   centro de custo, data de admissão e salário. CPF é validado automaticamente e o celular é formatado
   enquanto você digita.
3. Em **Dependentes**, clique em **"+ Adicionar dependente"** para cada dependente e informe o nome — a
   quantidade salva é sempre calculada a partir dessa lista.
4. Preencha CNH, NRs, certificações e equipamentos habilitados quando aplicável (campos de texto separados
   por vírgula).
5. Salve. A ação fica registrada no histórico de auditoria do colaborador.

### Editar um colaborador
Clique em **"Editar"** na linha desejada — o mesmo formulário abre em uma janela, já preenchido.

### Desligar um colaborador
Não existe campo de status "Desligado" editável diretamente no cadastro — o desligamento é sempre feito
pela ação dedicada, para garantir que o processo de saída (Desligamento Digital) seja aberto corretamente:

1. No menu **"⋮"** da linha do colaborador, clique em **"Desligar"**.
2. Escolha o motivo (pedido de demissão, dispensa sem/com justa causa, término de contrato de experiência,
   acordo entre as partes, aposentadoria ou "Outro") e a data de desligamento.
3. Confirme. O colaborador passa para o status "Desligado", uma solicitação zerada é criada no
   **Desligamento Digital** e você é levado direto para aquela tela.

Se precisar **corrigir ou lançar retroativamente** a data de desligamento de alguém que já está marcado
como desligado (por exemplo, ao regularizar um cadastro antigo), edite o colaborador normalmente: com o
status em "Desligado", o formulário libera o campo **"Data de demissão"**. Ao salvar, o sistema
cria/atualiza automaticamente o registro correspondente em Desligamento Digital — não é preciso mexer nas
duas telas separadamente.

### Excluir um colaborador
No menu **"⋮"**, clique em **"Excluir"** e confirme. É uma ação irreversível — use com cuidado.

### Importar colaboradores em massa
1. Clique em **"Importar colaboradores"**.
2. Clique em **"Baixar modelo Excel"** para obter a planilha-modelo já com as colunas certas (nome,
   código Domínio, CPF, celular, e-mail, cargo, departamento, filial, centro de custo, gestor, datas de
   admissão/demissão, salário, dependentes, CNH, NRs, certificações, equipamentos).
3. Preencha a planilha e selecione o arquivo (.csv, .xlsx ou .xls).
4. Confira a pré-visualização: cada linha mostra se será um **cadastro novo** ou uma **atualização**
   (o CPF é a chave de identificação) e aponta erros de preenchimento, se houver.
5. Clique em **"Confirmar importação"**.

Preencher a coluna de data de demissão numa linha já marca aquele colaborador como desligado e sincroniza o
Desligamento Digital automaticamente, igual à ação manual.

## 6. Recrutamento & Seleção

Funil de contratação e banco de currículos. Acesso: admin, RH e gestor.

### Funil (Kanban)
Etapas fixas, da esquerda para a direita: **Recebidos → Triagem → Entrevista → Avaliação → Aprovação de
Contratação**.

1. Clique em **"Novo candidato"**, informe nome, vaga e origem (LinkedIn, Banco de Currículos, Sólides ou
   outra) e salve — o candidato entra em "Recebidos".
2. Arraste o cartão do candidato entre as colunas conforme ele avança no processo.
3. Clique no cartão para editar os dados ou anotar a "fase atual" em texto livre; também é possível excluir
   o candidato ali (com confirmação).
4. Quando o candidato chegar em **"Aprovação de Contratação"**, o cartão ganha um botão **"Efetivar
   contratação"**. Clique nele, informe cargo, filial e data prevista de admissão — isso cria
   automaticamente o registro na **Admissão Digital** e leva você até lá. O botão fica marcado como
   "Enviado à Admissão" para não duplicar o envio.

### Banco de currículos
Alterne para **"Banco de currículos"** no topo da tela.

1. Clique em **"Nova pasta de cargo"** e nomeie a vaga (ex.: "Mecânico de Equipamentos Pesados").
2. Abra a pasta e arraste ou selecione os currículos (PDF/DOC/DOCX, até 50MB cada, vários de uma vez).
3. Cada currículo pode ser baixado/aberto ou excluído individualmente; a pasta inteira também pode ser
   excluída (isso apaga todos os currículos dentro dela).

## 7. Admissão Digital

Checklist de integração de quem foi efetivado no Recrutamento (ou lançado diretamente aqui). Acesso: admin
e RH.

Cada admissão é um cartão com nome, cargo, filial, previsão de admissão e uma barra de progresso. O
checklist tem 5 etapas, nesta ordem:

1. **Dados pessoais**
2. **Upload de documentos** — clique na etapa para abrir a lista de documentos pessoais obrigatórios e
   anexar cada um (alguns aceitam mais de um arquivo, como documentos de dependentes). A etapa se marca
   sozinha como concluída quando todos os documentos obrigatórios estiverem anexados.
3. **Exame admissional**
4. **Assinatura eletrônica do contrato**
5. **Envio ao Domínio Sistemas**

As etapas 3 a 5 só ficam disponíveis depois que o upload de documentos estiver completo. As demais são
marcadas manualmente com um clique.

- O ícone de relógio no cartão abre o **histórico**: toda mudança de etapa fica registrada com data/hora e
  quem fez.
- O "×" no cartão cancela a admissão (pede confirmação).
- Quando o checklist chega a 100%, aparece o botão **"Cadastro oficial"** — ele leva para o Cadastro de
  Colaboradores com o formulário de novo colaborador já preenchido (nome, cargo, filial, data de admissão)
  e os documentos anexados durante a admissão já aparecem na aba Documentos do colaborador, sem precisar
  reanexar nada.

## 8. Documentos

Repositório de documentos pessoais por colaborador (inclusive quem não passou pela Admissão Digital).
Acesso: admin e RH.

1. Localize o colaborador na tabela (mesma busca/filtro do Cadastro de Colaboradores) e veja quantos
   documentos já estão anexados (ex.: "5/6 anexados").
2. Clique em **"Ver documentos"** para abrir a lista: os documentos pessoais obrigatórios (os mesmos da
   Admissão Digital) mais quaisquer documentos extras já criados para aquela pessoa.
3. Para anexar, remover ou substituir um arquivo, use os botões ao lado de cada documento.
4. Para adicionar um documento específico daquele colaborador (ex.: "Atestado médico", "Termo de
   confidencialidade"), digite o nome no campo indicado e clique em **"Criar documento"**. Documentos
   extras podem ser excluídos por completo; os obrigatórios não — só anexados/removidos.

## 9. Desligamento Digital

Checklist do processo de saída, aberto automaticamente quando alguém é desligado pelo Cadastro de
Colaboradores. Acesso: admin e RH.

A tela tem três visões, alternadas no topo:

### Kanban (visão padrão)
Colunas, nesta ordem: **Entrevista de desligamento → Devolução de equipamentos e EPIs → Exame demissional →
Acerto rescisório → Concluído**.

- Arraste o cartão entre as colunas conforme o processo avança. Algumas etapas (devolução de equipamentos,
  exame demissional, acerto rescisório) exigem que um documento seja anexado antes de avançar — se faltar,
  o sistema avisa e bloqueia o arraste.
- Clique no cartão para escrever uma observação livre.
- No menu **"⋮"** do cartão: **Anexar documento** (quando a etapa exige), **Enviar para o checklist**
  (só habilitado quando o cartão chega em "Concluído" — é isso que faz o colaborador aparecer na aba
  Checklist), **Ver histórico** e **Cancelar desligamento**.

### Checklist
Mostra só quem já foi "enviado para o checklist" pelo Kanban. Cada colaborador aparece com uma barra de
progresso das 4 etapas (Entrevista, Devolução de equipamentos, Exame demissional, Acerto rescisório) e um
botão **"Cancelar desligamento"**, que reverte tudo e volta o colaborador para "Ativo".

### Todos
Lista simples com todos os desligamentos (colaborador, filial, motivo, data e situação) e atalhos para ver
observação, ver histórico ou cancelar.

### Importar desligamentos em massa
Clique em **"Importar desligamentos"**, baixe o modelo, preencha (CPF, motivo, data e as 4 colunas de
checklist com Sim/Não) e confirme após revisar a pré-visualização — útil para lançar um histórico de
desligamentos já ocorridos. O CPF precisa bater com um colaborador já cadastrado.

## 10. Gestão de Férias

Fluxo de solicitação, aprovação e controle de saldo de férias, seguindo a regra da CLT (30 dias por período
aquisitivo de 12 meses trabalhados, a gozar nos 12 meses seguintes). Acesso: admin e RH.

### Solicitar férias
1. Clique em **"Solicitar férias"**.
2. Escolha o colaborador (o saldo disponível e o período aquisitivo aparecem automaticamente).
3. Escolha as datas de início e fim — o sistema calcula os dias corridos. É preciso pedir no mínimo 5 dias
   seguidos e não é possível ultrapassar o saldo disponível.
4. Confirme. A solicitação entra como "Pendente".

### Aprovar, recusar, prorrogar ou cancelar
Na aba **Solicitações**:
- **Pendentes de aprovação**: clique em **Aprovar** (imediato) ou **Recusar** (exige um motivo).
- **Aprovadas**: clique em **Prorrogar** para estender o período (novo fim + motivo, sempre validado contra
  o saldo restante) ou em **Cancelar** para desistir de uma aprovação (o saldo volta a ficar disponível).
- **Histórico**: mostra as solicitações recusadas/canceladas com o motivo.

### Saldo de férias
Aba com o saldo calculado automaticamente por colaborador: período aquisitivo, limite para gozo, dias
usados e dias disponíveis.

- Se houver férias **vencidas** (período concessivo estourado sem gozo), elas aparecem destacadas em
  vermelho no topo, com uma estimativa do valor a pagar em dobro (conforme art. 137 da CLT) — é só uma
  estimativa para priorizar, confirme sempre com o financeiro antes de usar em folha.
- **"Ajustar saldo"**: use para corrigir manualmente o saldo de alguém que já tirou férias antes deste
  sistema existir (informe os dias a somar aos "usados" e o motivo) e/ou marque a caixa **"Sem pendência de
  férias de anos anteriores"** para não sinalizar como vencida uma pendência que na prática já foi resolvida
  fora do sistema.

## 11. Avaliação de Desempenho

Ciclo de avaliação com autoavaliação, avaliação do gestor, metas e PDI. Acesso: admin, RH (veem todo mundo)
e gestor (vê e avalia só quem tem ele como "Gestor" no cadastro).

### Iniciar um ciclo
1. Clique em **"Iniciar avaliação"** (admin/RH).
2. Escolha o colaborador.
3. Cadastre as metas do ciclo, cada uma com um peso — a soma dos pesos precisa fechar em 100%.
4. Confirme — a tabela padrão de competências entra automaticamente.

### Lançar notas
Abra **"Ver detalhes"** na linha do colaborador. Para cada competência e cada meta, lance a nota de 1 a 5
na coluna "Auto" (autoavaliação) e/ou "Gestor" e clique em **"Salvar notas"**. A nota final só fecha depois
que o gestor avaliar todos os itens; ela é sempre calculada pelo sistema (competências 40% / metas 60%,
dentro de cada uma 30% autoavaliação / 70% gestor — valores de referência, sujeitos a ajuste).

### PDI (Plano de Desenvolvimento Individual)
Dentro do mesmo detalhe, adicione ações de desenvolvimento com prazo, acompanhe o status (pendente / em
andamento / concluído) e marque itens atrasados. Admin/RH podem excluir uma avaliação inteira, se
necessário.

## 12. Competências

Consulta (somente leitura) das qualificações de todos os colaboradores ativos — NRs, certificações,
equipamentos habilitados e categoria de CNH, reunidos num só lugar. Acesso: admin, RH e gestor.

Digite na busca um nome, cargo, filial **ou** uma competência específica (ex.: "NR-35", "Munck") para ver
quem tem aquela qualificação — os resultados que baterem aparecem destacados. Para alterar as competências
de alguém, edite o colaborador no Cadastro de Colaboradores; esta tela não tem edição.

## 13. Gestão de ASOs

Consulta (somente leitura) dos exames ocupacionais (ASO), sincronizada do sistema externo EPI Controle.
Acesso: admin, RH e gestor.

- Clique em **"Atualizar"** para buscar os dados mais recentes (mostra a hora da última sincronização).
- Os cartões no topo resumem o total de ASOs, vencidos, a vencer em 30 dias e em dia.
- Use as abas **Todos / A vencer / Vencidos** e a busca/filtros da tabela para localizar um registro. O
  ícone de link externo abre o registro completo direto no EPI Controle.

## 14. Gestão de EPIs

Consulta (somente leitura) dos equipamentos de proteção (EPIs) entregues a cada colaborador, também
sincronizada do EPI Controle. Acesso: admin, RH e gestor.

Clique em **"Atualizar"** para sincronizar, use o filtro por empresa e o alternador **Todos / Com EPI / Sem
EPI**, e clique num cartão para expandir a lista de EPIs daquela pessoa com a validade de cada item.

## 15. Gestão de Equipes

Autoavaliação periódica (mensal) que cada gestor faz da própria equipe, formando um histórico comparável
entre times. Acesso: admin, RH e gestor.

1. No cartão do time, clique em **"Registrar avaliação"**.
2. Escolha o período (mês/ano) — o campo "Gestor responsável" já vem preenchido com o seu nome.
3. Dê uma nota de 1 a 5 (estrelas) para cada indicador (clima, produtividade, segurança do trabalho,
   quadro/dotação).
4. Escreva um resumo de como está a equipe (obrigatório) e, se houver, pontos de atenção para o RH.
5. Salve.

Cada avaliação salva fica registrada para sempre (não é possível editar ou excluir uma avaliação já
lançada) — é assim que o histórico e a comparação entre times ao longo do tempo ficam confiáveis. A tabela
"Comparativo entre equipes" no topo mostra a foto mais recente de cada time.

## 16. Comunicação Interna

Mural de comunicados da empresa, com aniversariantes e férias da equipe. Acesso: todos os perfis (a
publicação de comunicados é restrita a admin/RH).

- O aviso **"Chegando"** no topo mostra o que vai acontecer nos próximos 3 dias (aniversários, comunicados
  com data marcada, férias que estão para começar).
- **Mural de comunicados**: admin/RH clicam em **"Novo comunicado"** para publicar (título, autor, data do
  evento opcional, conteúdo). Todos os perfis podem ler, buscar e filtrar por mês ou por
  Futuros/Todos/Anteriores.
- **Aniversariantes**: alimentado pela data de nascimento cadastrada no Cadastro de Colaboradores — só
  aparece quem tiver essa data preenchida.
- **Férias da equipe**: mostra as férias já aprovadas na Gestão de Férias, com filtro por
  Em andamento/Agendadas/Concluídas/Todas.

## 17. IA Corporativa (Max)

Assistente de chat (`/ia`) para dúvidas de RH/Departamento Pessoal — admissão, documentos, férias,
desligamento, cadastro, benefícios, avaliação de desempenho e comunicação interna. Acesso: todos os
perfis.

- Clique em uma das sugestões de pergunta ou digite a sua e pressione Enter/clique em **Enviar**.
- O Max responde só sobre assuntos de trabalho ligados a RH/DP — qualquer outro assunto recebe uma recusa
  educada padrão. Ele também nunca inventa dado que não tem (saldo de férias de alguém, datas específicas
  etc.); nesses casos, orienta a consultar a tela correta ou falar com o RH.

## 18. Logs de Auditoria

Histórico de quem alterou o quê e quando, em todos os módulos do sistema. Acesso: **somente
administrador** — nem aparece no menu para os demais perfis.

- Filtre por texto (usuário, e-mail, registro), módulo, tipo de ação (criação/edição/exclusão) e período.
- Clique em **"Ver detalhes"** numa linha para ver exatamente quais campos mudaram, no formato
  "antes → depois".

## 19. Perguntas frequentes

**Um módulo aparece com cadeado no menu. O que isso significa?**
Seu perfil de acesso não tem permissão para aquele módulo. Fale com o RH/administrador se achar que deveria
ter acesso.

**Fiz alterações e, ao recarregar a página, elas sumiram.**
Você está em ambiente de demonstração (sem banco de dados real configurado) — é normal, serve só para
testar as telas. Em produção, com o Supabase configurado, tudo é salvo normalmente.

**Como faço para excluir um comunicado, currículo, documento extra ou solicitação por engano?**
Cada tela tem seu próprio botão de exclusão/cancelamento (geralmente um ícone de lixeira ou "×") e sempre
pede confirmação antes de executar, exatamente para evitar exclusões acidentais.

**Onde vejo quem alterou um registro pela última vez?**
No selo "Editado por Fulano · data/hora" que aparece ao lado da maioria dos registros — clique nele para
abrir o histórico completo. O detalhamento completo de todas as alterações do sistema fica em **Logs de
Auditoria** (acesso restrito ao administrador).

---

Dúvidas que não estão neste manual? Fale com o RH ou com o administrador do sistema.
