import { useNavigate } from "react-router-dom";
import { UserPen, GraduationCap, Megaphone, Bot } from "lucide-react";

const ACOES = [
  { id: "dados", icon: UserPen, titulo: "Atualizar dados de colaborador", desc: "Abre o Cadastro de Colaboradores para editar dados, contato e informações bancárias.", path: "/colaboradores" },
  { id: "treinamentos", icon: GraduationCap, titulo: "Treinamentos e NRs", desc: "Cursos, reciclagens e validade de treinamentos.", path: "/treinamentos" },
  { id: "comunicados", icon: Megaphone, titulo: "Comunicação interna", desc: "Mural, avisos, aniversariantes e enquetes do RH.", path: "/comunicacao" },
  { id: "ia", icon: Bot, titulo: "Conversar com a IA", desc: "Pergunte sobre validade de NR, ASO, treinamentos e mais.", path: "/ia" },
];

export default function PortalColaborador() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Acesso Rápido</h1>
          <div className="page-subtitle">
            Atalhos para as tarefas mais comuns do dia a dia com colaboradores.
          </div>
        </div>
      </div>

      <div className="grid grid-3">
        {ACOES.map((acao) => {
          const Icon = acao.icon;
          return (
            <div
              className="card card-pad action-card"
              key={acao.id}
              onClick={() => navigate(acao.path)}
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
    </div>
  );
}
