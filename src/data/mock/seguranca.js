// Mock estruturado como "SESMT/Seguranca_do_Trabalho/" (pastas e planilhas no SharePoint).
// Dados fictícios só para simular como a tela ficaria com registros reais —
// quando a integração com o backend (rh_seguranca_trabalho) entrar, estes arrays saem.

export const DOCUMENTOS_LEGAIS = [
  { id: 1, documento: "PGR", filial: "Matriz — São Paulo/SP", validade: "2027-02-15", status: "Válido" },
  { id: 2, documento: "PCMSO", filial: "Matriz — São Paulo/SP", validade: "2026-11-30", status: "Válido" },
  { id: 3, documento: "PGR", filial: "Filial — Campinas/SP", validade: "2026-10-05", status: "Vencendo" },
  { id: 4, documento: "PCMSO", filial: "Filial — Campinas/SP", validade: "2026-09-20", status: "Vencendo" },
  { id: 5, documento: "PGR", filial: "Filial — Ribeirão Preto/SP", validade: "2026-04-01", status: "Vencido" },
  { id: 6, documento: "PCMSO", filial: "Filial — Ribeirão Preto/SP", validade: "2027-01-10", status: "Válido" },
  { id: 7, documento: "LTCAT", filial: "Matriz — São Paulo/SP", validade: "2027-05-22", status: "Válido" },
];

export const APRS = [
  { id: 1, atividade: "Trabalho em altura — manutenção de telhado", equipe: "Manutenção Predial", risco: "Queda de nível", status: "Aprovado" },
  { id: 2, atividade: "Operação de empilhadeira no armazém", equipe: "Logística", risco: "Colisão / atropelamento", status: "Aprovado" },
  { id: 3, atividade: "Entrada em espaço confinado — cisterna", equipe: "Manutenção Predial", risco: "Asfixia / gases tóxicos", status: "Pendente" },
  { id: 4, atividade: "Serviço em instalação elétrica energizada", equipe: "Elétrica", risco: "Choque elétrico", status: "Aprovado" },
  { id: 5, atividade: "Movimentação de cargas com talha", equipe: "Produção", risco: "Queda de carga suspensa", status: "Reprovado" },
];

export const DDS_REGISTROS = [
  { id: 1, tema: "Uso correto de EPI", equipe: "Produção", data: "2026-09-01", participantes: 18 },
  { id: 2, tema: "Trabalho em altura — NR-35", equipe: "Manutenção Predial", data: "2026-09-03", participantes: 9 },
  { id: 3, tema: "Ergonomia no posto de trabalho", equipe: "Administrativo", data: "2026-09-05", participantes: 22 },
  { id: 4, tema: "Prevenção de incêndio e uso de extintores", equipe: "Todas as equipes", data: "2026-09-08", participantes: 45 },
  { id: 5, tema: "Direção defensiva", equipe: "Logística", data: "2026-09-10", participantes: 12 },
  { id: 6, tema: "Espaços confinados — NR-33", equipe: "Manutenção Predial", data: "2026-09-12", participantes: 7 },
];

export const INSPECOES = [
  { id: 1, item: "Extintores de incêndio — Matriz", tipo: "Combate a incêndio", data: "2026-08-20", resultado: "Conforme" },
  { id: 2, item: "Empilhadeira EMP-03", tipo: "Equipamento", data: "2026-08-25", resultado: "Conforme" },
  { id: 3, item: "Saídas de emergência — Filial Campinas", tipo: "Rota de fuga", data: "2026-08-28", resultado: "Não conforme" },
  { id: 4, item: "Quadro elétrico — Setor produção", tipo: "Instalação elétrica", data: "2026-09-02", resultado: "Não conforme" },
  { id: 5, item: "EPIs em estoque — Almoxarifado", tipo: "EPI", data: "2026-09-06", resultado: "Conforme" },
];

export const NAO_CONFORMIDADES = [
  {
    id: 1,
    descricao: "Saída de emergência obstruída — Filial Campinas",
    planoAcao: "Desobstruir rota de fuga e sinalizar piso",
    responsavel: "Marina Alves Costa",
    prazo: "2026-09-25",
    status: "Em andamento",
  },
  {
    id: 2,
    descricao: "Quadro elétrico sem sinalização de risco",
    planoAcao: "Instalar sinalização e travas de segurança",
    responsavel: "Ricardo Souza Martins",
    prazo: "2026-09-30",
    status: "Pendente",
  },
  {
    id: 3,
    descricao: "APR de espaço confinado não assinada pela equipe",
    planoAcao: "Reaplicar treinamento NR-33 e revalidar APR",
    responsavel: "Carlos Eduardo Silva",
    prazo: "2026-09-18",
    status: "Atrasado",
  },
  {
    id: 4,
    descricao: "Extintor vencido no setor de produção",
    planoAcao: "Substituir e recarregar extintor",
    responsavel: "Fernanda Lima Rocha",
    prazo: "2026-09-15",
    status: "Concluído",
  },
];

export const CATS = [
  {
    id: 1,
    colaborador: "Bruno Henrique Oliveira",
    data: "2026-07-14",
    descricao: "Corte superficial na mão durante manuseio de ferramenta",
    status: "Concluído",
  },
  {
    id: 2,
    colaborador: "Diego Nascimento Pereira",
    data: "2026-08-02",
    descricao: "Torção no tornozelo em queda de mesmo nível",
    status: "Em andamento",
  },
  {
    id: 3,
    colaborador: "Camila Rodrigues Teixeira",
    data: "2026-09-05",
    descricao: "Contusão no braço por queda de material em prateleira",
    status: "Pendente",
  },
];
