// Mock estruturado como "RH/Recrutamento/Pipeline_Vagas.xlsx" (SharePoint).

export const PIPELINE_STAGES = [
  {
    id: "recebidos",
    titulo: "Recebidos",
    candidatos: [
      { id: "CAND-1", nome: "Felipe Cardoso", vaga: "Operador de Guindaste", origem: "LinkedIn" },
      { id: "CAND-2", nome: "Bruna Castro", vaga: "Analista de RH Jr.", origem: "Banco de currículos" },
    ],
  },
  {
    id: "triagem",
    titulo: "Triagem",
    candidatos: [
      { id: "CAND-3", nome: "Vitor Hugo Reis", vaga: "Rigger", origem: "Indicação" },
    ],
  },
  {
    id: "entrevista",
    titulo: "Entrevista",
    candidatos: [
      { id: "CAND-4", nome: "Camila Nogueira", vaga: "Técnica de Segurança do Trabalho", origem: "LinkedIn" },
    ],
  },
  {
    id: "avaliacao",
    titulo: "Avaliação",
    candidatos: [],
  },
  {
    id: "aprovacao",
    titulo: "Aprovação de Contratação",
    candidatos: [
      { id: "CAND-5", nome: "Thiago Almeida", vaga: "Motorista", origem: "Banco de talentos" },
    ],
  },
];
