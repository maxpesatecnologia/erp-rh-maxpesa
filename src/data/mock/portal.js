// Mock dos serviços de autoatendimento do colaborador logado. Em produção,
// isso viria do Domínio Sistemas (férias / banco de horas / dados cadastrais)
// e do SharePoint (documentos). Por enquanto é só estado local — nada aqui é
// persistido além da sessão do navegador.

export const MEUS_DADOS_CADASTRAIS = {
  endereco: {
    logradouro: "Rua das Guaribas",
    numero: "245",
    bairro: "Vila Nova",
    cidade: "Campinas",
    uf: "SP",
    cep: "13070-172",
  },
  contatoEmergencia: {
    nome: "Marta Pereira",
    parentesco: "Cônjuge",
    telefone: "(19) 98877-6655",
  },
  dadosBancarios: {
    banco: "Banco do Brasil",
    agencia: "1234-5",
    conta: "98765-4",
    tipoConta: "Conta Corrente",
    pix: "joao.pereira@maxpesa.com.br",
  },
};

export const SALDO_FERIAS = {
  diasDisponiveis: 22,
  periodoAquisitivo: "15/03/2025 a 14/03/2026",
  limiteParaGozo: "14/03/2027",
  historico: [
    { periodo: "2023/2024", diasGozados: 30, dataInicio: "2024-04-10" },
    { periodo: "2022/2023", diasGozados: 30, dataInicio: "2023-05-02" },
  ],
};

export const MINHAS_SOLICITACOES_FERIAS = [
  { id: "FER-118", periodo: "18/08/2026 a 01/09/2026", dias: 15, status: "Aprovada", solicitadoEm: "2026-07-02" },
];

export const BANCO_DE_HORAS = {
  saldoAtual: 12.5,
  extrato: [
    { data: "2026-08-05", tipo: "Crédito", horas: 2.5, motivo: "Hora extra - turno noturno", saldoAcumulado: 12.5 },
    { data: "2026-07-28", tipo: "Débito", horas: 4, motivo: "Saída antecipada", saldoAcumulado: 10 },
    { data: "2026-07-15", tipo: "Crédito", horas: 6, motivo: "Plantão de sábado", saldoAcumulado: 14 },
    { data: "2026-06-30", tipo: "Crédito", horas: 3.5, motivo: "Hora extra - operação guindaste", saldoAcumulado: 8 },
  ],
};

export const DOCUMENTOS_PARA_ASSINAR = [
  { id: "DOC-901", nome: "Aditivo de Função - Operador Sênior", tipo: "Aditivo contratual", enviadoEm: "2026-08-08" },
  { id: "DOC-902", nome: "Termo de Responsabilidade - EPI", tipo: "Termo", enviadoEm: "2026-08-10" },
];

export const MEUS_DOCUMENTOS_ENVIADOS = [
  { id: "UP-55", nome: "Atestado_medico_julho.pdf", tipo: "Atestado médico", enviadoEm: "2026-07-22", status: "Aprovado" },
  { id: "UP-56", nome: "Comprovante_residencia.pdf", tipo: "Comprovante de residência", enviadoEm: "2026-08-01", status: "Em análise" },
];

export const MEUS_TREINAMENTOS = [
  { id: "MT-1", curso: "NR-35 - Trabalho em Altura (Reciclagem)", cargaHoraria: 8, progresso: 100, validade: "2026-11-02" },
  { id: "MT-2", curso: "NR-33 - Espaços Confinados", cargaHoraria: 16, progresso: 40, validade: null },
  { id: "MT-3", curso: "Direção Defensiva", cargaHoraria: 4, progresso: 0, validade: null },
];

export const MINHAS_SOLICITACOES_RH = [
  { id: "RH-2026-0041", categoria: "Declaração", assunto: "Declaração de vínculo empregatício", status: "Concluída", abertoEm: "2026-07-30" },
  { id: "RH-2026-0052", categoria: "Benefícios", assunto: "Dúvida sobre coparticipação do plano de saúde", status: "Em atendimento", abertoEm: "2026-08-06" },
];
