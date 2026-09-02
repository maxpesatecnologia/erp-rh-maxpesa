// Mock dos serviços de autoatendimento do colaborador logado. Em produção,
// isso viria do Domínio Sistemas (férias / banco de horas / dados cadastrais)
// e do SharePoint (documentos). Por enquanto é só estado local — nada aqui é
// persistido além da sessão do navegador.

export const MEUS_DADOS_CADASTRAIS = {
  telefone: "",
  endereco: {
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: "",
  },
  contatoEmergencia: {
    nome: "",
    parentesco: "",
    telefone: "",
  },
  dadosBancarios: {
    banco: "",
    agencia: "",
    conta: "",
    tipoConta: "",
    pix: "",
  },
};

export const SALDO_FERIAS = {
  diasDisponiveis: 0,
  periodoAquisitivo: "",
  limiteParaGozo: "",
  historico: [],
};

export const MINHAS_SOLICITACOES_FERIAS = [];

export const BANCO_DE_HORAS = {
  saldoAtual: 0,
  extrato: [],
};

export const DOCUMENTOS_PARA_ASSINAR = [];

export const MEUS_DOCUMENTOS_ENVIADOS = [];

export const MEUS_TREINAMENTOS = [];

export const MINHAS_SOLICITACOES_RH = [];