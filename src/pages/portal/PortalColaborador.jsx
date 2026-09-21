import { useNavigate } from "react-router-dom";
import { NAV_SECTIONS } from "../../config/modules";
import { useAuth } from "../../context/AuthContext";

// Descrições curtas por rota, no mesmo tom das antigas ações fixas do
// Acesso Rápido. Módulo sem entrada aqui cai no fallback (label do Sidebar).
const DESCRICOES = {
  "/": "Indicadores e visão geral do RH em um só lugar.",
  "/colaboradores": "Cadastro, dados, contato e informações bancárias dos colaboradores.",
  "/recrutamento": "Vagas, candidatos e banco de currículos.",
  "/admissao": "Admissão digital de novos colaboradores.",
  "/documentos": "Documentos enviados, pendentes e assinados.",
  "/desligamento": "Desligamento digital e histórico de saídas.",
  "/ferias": "Solicitação, aprovação e saldo de férias.",
  "/treinamentos": "Cursos, reciclagens e validade de treinamentos e NRs.",
  "/avaliacao-desempenho": "Avaliações de desempenho dos colaboradores.",
  "/operadores": "Competências, certificados e habilitações da equipe.",
  "/seguranca": "Segurança do trabalho, incidentes e ações preventivas.",
  "/medicina": "Gestão de ASOs e acompanhamento de medicina ocupacional.",
  "/epis": "Controle de entrega e validade de EPIs.",
  "/equipes": "Verificação automática de requisitos por contrato e equipe.",
  "/comunicacao": "Mural, avisos, aniversariantes e férias da equipe.",
  "/ia": "Pergunte sobre validade de NR, ASO, treinamentos e mais.",
};

export default function PortalColaborador() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const secoes = NAV_SECTIONS.map((secao) => ({
    ...secao,
    items: secao.items.filter(
      (item) => item.path !== "/portal" && item.roles.includes(user?.role)
    ),
  })).filter((secao) => secao.items.length > 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Acesso Rápido</h1>
          <div className="page-subtitle">
            Atalhos para todos os módulos disponíveis para o seu perfil.
          </div>
        </div>
      </div>

      {secoes.map((secao) => (
        <div key={secao.title} style={{ marginBottom: 24 }}>
          <div className="section-title">{secao.title}</div>
          <div className="grid grid-3">
            {secao.items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  className="card card-pad action-card"
                  key={item.path}
                  onClick={() => navigate(item.path)}
                >
                  <div className="action-icon">
                    <Icon size={22} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
                    {DESCRICOES[item.path] ?? item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
