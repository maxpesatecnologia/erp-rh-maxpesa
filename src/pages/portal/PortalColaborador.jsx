import { useState } from "react";
import SourceTag from "../../components/SourceTag";
import { useAuth } from "../../context/AuthContext";

const ACOES = [
  { icon: "✏️", titulo: "Atualizar dados cadastrais", desc: "Endereço, contato de emergência, dados bancários." },
  { icon: "🏖️", titulo: "Solicitar férias", desc: "Envie um pedido de férias para aprovação do gestor." },
  { icon: "📆", titulo: "Consultar saldo de férias", desc: "Sincronizado com o Domínio Sistemas." },
  { icon: "⏱️", titulo: "Consultar banco de horas", desc: "Extrato de horas extras e compensações." },
  { icon: "✍️", titulo: "Assinar documentos", desc: "Documentos pendentes de assinatura eletrônica." },
  { icon: "📤", titulo: "Enviar documentos", desc: "Upload de atestados, comprovantes e certificados." },
  { icon: "🎓", titulo: "Fazer treinamentos", desc: "Cursos e reciclagens de NR pendentes." },
  { icon: "📣", titulo: "Consultar comunicados", desc: "Mural, notícias e avisos do RH." },
  { icon: "🆘", titulo: "Abrir solicitação ao RH", desc: "Dúvidas, declarações e pedidos administrativos." },
  { icon: "🤖", titulo: "Conversar com a IA", desc: "Pergunte sobre validade de NR, ASO, treinamentos e mais." },
];

export default function PortalColaborador() {
  const { user } = useAuth();
  const [aberto, setAberto] = useState(null);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Portal do Colaborador</h1>
          <div className="page-subtitle">
            Olá, {user?.nome ?? "colaborador"} — aqui estão os serviços disponíveis para você.
          </div>
        </div>
        <SourceTag path="Domínio Sistemas (férias/banco de horas) + SharePoint (documentos)" />
      </div>

      <div className="grid grid-3">
        {ACOES.map((acao) => (
          <div className="card card-pad" key={acao.titulo} style={{ cursor: "pointer" }} onClick={() => setAberto(acao.titulo)}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{acao.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{acao.titulo}</div>
            <div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>{acao.desc}</div>
          </div>
        ))}
      </div>

      {aberto && (
        <div className="card card-pad" style={{ marginTop: 20 }}>
          <div className="section-title">{aberto}</div>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            Esta é uma tela de demonstração. Em produção, esta ação abrirá o fluxo real
            integrado ({aberto.includes("férias") || aberto.includes("banco de horas") ? "Domínio Sistemas" : "SharePoint / assinatura eletrônica"}).
          </p>
          <button className="btn btn-outline" style={{ marginTop: 10 }} onClick={() => setAberto(null)}>
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
