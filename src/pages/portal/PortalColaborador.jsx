import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPen,
  Palmtree,
  CalendarDays,
  Timer,
  PenLine,
  Upload,
  GraduationCap,
  Megaphone,
  LifeBuoy,
  Bot,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import DadosCadastraisPanel from "./panels/DadosCadastraisPanel";
import SolicitarFeriasPanel from "./panels/SolicitarFeriasPanel";
import SaldoFeriasPanel from "./panels/SaldoFeriasPanel";
import BancoHorasPanel from "./panels/BancoHorasPanel";
import AssinarDocumentosPanel from "./panels/AssinarDocumentosPanel";
import EnviarDocumentosPanel from "./panels/EnviarDocumentosPanel";
import TreinamentosPanel from "./panels/TreinamentosPanel";
import ComunicadosPanel from "./panels/ComunicadosPanel";
import SolicitacaoRHPanel from "./panels/SolicitacaoRHPanel";

const ACOES = [
  { id: "dados", icon: UserPen, titulo: "Atualizar dados cadastrais", desc: "Endereço, contato de emergência, dados bancários.", panel: DadosCadastraisPanel },
  { id: "solicitar-ferias", icon: Palmtree, titulo: "Solicitar férias", desc: "Envie um pedido de férias para aprovação do gestor.", panel: SolicitarFeriasPanel },
  { id: "saldo-ferias", icon: CalendarDays, titulo: "Consultar saldo de férias", desc: "Sincronizado com o Domínio Sistemas.", panel: SaldoFeriasPanel },
  { id: "banco-horas", icon: Timer, titulo: "Consultar banco de horas", desc: "Extrato de horas extras e compensações.", panel: BancoHorasPanel },
  { id: "assinar-docs", icon: PenLine, titulo: "Assinar documentos", desc: "Documentos pendentes de assinatura eletrônica.", panel: AssinarDocumentosPanel },
  { id: "enviar-docs", icon: Upload, titulo: "Enviar documentos", desc: "Upload de atestados, comprovantes e certificados.", panel: EnviarDocumentosPanel },
  { id: "treinamentos", icon: GraduationCap, titulo: "Fazer treinamentos", desc: "Cursos e reciclagens de NR pendentes.", panel: TreinamentosPanel },
  { id: "comunicados", icon: Megaphone, titulo: "Consultar comunicados", desc: "Mural, notícias e avisos do RH.", panel: ComunicadosPanel },
  { id: "chamado-rh", icon: LifeBuoy, titulo: "Abrir solicitação ao RH", desc: "Dúvidas, declarações e pedidos administrativos.", panel: SolicitacaoRHPanel },
  { id: "ia", icon: Bot, titulo: "Conversar com a IA", desc: "Pergunte sobre validade de NR, ASO, treinamentos e mais.", path: "/ia" },
];

export default function PortalColaborador() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selecionada, setSelecionada] = useState(null);
  const [painelAberto, setPainelAberto] = useState(false);

  function abrirAcao(acao) {
    if (acao.path) {
      navigate(acao.path);
      return;
    }
    setSelecionada(acao);
    setPainelAberto(true);
  }

  const PanelComponent = selecionada?.panel;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Portal do Colaborador</h1>
          <div className="page-subtitle">
            Olá, {user?.nome ?? "colaborador"} — aqui estão os serviços disponíveis para você.
          </div>
        </div>
      </div>

      <div className="grid grid-3">
        {ACOES.map((acao) => {
          const Icon = acao.icon;
          const ativo = selecionada?.id === acao.id && painelAberto;
          return (
            <div
              className={`card card-pad action-card ${ativo ? "action-card-active" : ""}`}
              key={acao.id}
              onClick={() => abrirAcao(acao)}
            >
              <div className="action-icon">
                <Icon size={22} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{acao.titulo}</div>
              <div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>{acao.desc}</div>
            </div>
          );
        })}
      </div>

      <div className={`collapse ${painelAberto ? "open" : ""}`}>
        <div className="collapse-inner">
          {PanelComponent && (
            <div className="card card-pad collapse-content" style={{ marginTop: 20 }} key={selecionada.id}>
              <PanelComponent />
              <div className="panel-actions" style={{ marginTop: 18, borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
                <button className="btn btn-outline" onClick={() => setPainelAberto(false)}>
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
