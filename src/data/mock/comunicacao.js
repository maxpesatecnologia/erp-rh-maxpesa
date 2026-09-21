// Mock estruturado como "Comunicacao/Mural/" no SharePoint — usado só em modo
// demo (sem Supabase configurado). Com o Supabase real, comunicados vêm de
// rh_comunicados (src/lib/comunicacaoApi.js) e aniversariantes vêm do campo
// "Data de nascimento" de rh_colaboradores (ver ComunicacaoInterna.jsx).

export const COMUNICADOS = [
  {
    id: "com-1",
    titulo: "Reunião geral de setembro",
    autor: "Diretoria",
    data: "2026-09-12",
    dataEvento: "2026-09-16",
    conteudo: "Encontro geral com todas as equipes para apresentação dos resultados do trimestre e prioridades do próximo período.",
  },
  {
    id: "com-2",
    titulo: "Nova política de home office",
    autor: "RH",
    data: "2026-09-10",
    dataEvento: null,
    conteudo: "A partir de outubro, os pedidos de home office passam a ser feitos direto pelo portal do colaborador.",
  },
  {
    id: "com-3",
    titulo: "Semana da Qualidade de Vida",
    autor: "RH",
    data: "2026-09-05",
    dataEvento: "2026-09-22",
    conteudo: "Uma semana com palestras, ginástica laboral e avaliações de saúde para todos os colaboradores.",
  },
  {
    id: "com-4",
    titulo: "Confraternização de fim de ano — save the date",
    autor: "RH",
    data: "2026-09-01",
    dataEvento: "2026-12-18",
    conteudo: "Já reserve a data: nossa confraternização de fim de ano acontece no dia 18/12, a partir das 19h.",
  },
  {
    id: "com-5",
    titulo: "Campanha de vacinação na empresa",
    autor: "RH",
    data: "2026-08-28",
    dataEvento: null,
    conteudo: "Encerrada com sucesso a campanha de vacinação contra a gripe, com mais de 80% de adesão.",
  },
  {
    id: "com-6",
    titulo: "Resultado da pesquisa de clima 2026",
    autor: "RH",
    data: "2026-07-15",
    dataEvento: null,
    conteudo: "Confira os principais destaques da pesquisa de clima organizacional deste ano e os planos de ação definidos.",
  },
];

export const ANIVERSARIANTES = [
  { id: "ani-1", nome: "Camila Ferreira", data: "1985-09-14" },
  { id: "ani-2", nome: "Mariana Duarte", data: "1990-09-16" },
  { id: "ani-3", nome: "Rafael Costa", data: "1988-09-22" },
  { id: "ani-4", nome: "Bianca Souza", data: "1995-01-08" },
  { id: "ani-5", nome: "Eduardo Lima", data: "1992-03-30" },
  { id: "ani-6", nome: "Thiago Almeida", data: "1991-12-05" },
  { id: "ani-7", nome: "Patrícia Gomes", data: "1993-11-19" },
  { id: "ani-8", nome: "Lucas Martins", data: "1989-06-02" },
];

// Controle de férias da equipe, exibido no mural para o RH acompanhar quem está
// de férias, agendado ou recém-voltado. Quando integrado à planilha/BD, deve vir
// das solicitações de férias aprovadas (hoje em src/data/mock/portal.js, por colaborador).
export const FERIAS_EQUIPE = [
  { id: "fer-1", nome: "Ana Beatriz Lopes", inicio: "2026-09-01", fim: "2026-09-20" },
  { id: "fer-2", nome: "Helena Martins", inicio: "2026-09-14", fim: "2026-09-28" },
  { id: "fer-3", nome: "Diego Ramos", inicio: "2026-09-16", fim: "2026-09-30" },
  { id: "fer-4", nome: "Fernanda Rocha", inicio: "2026-10-05", fim: "2026-10-20" },
  { id: "fer-5", nome: "Gustavo Pinto", inicio: "2026-08-01", fim: "2026-08-15" },
];
