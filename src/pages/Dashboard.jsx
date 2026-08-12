import SourceTag from "../components/SourceTag";
import DataTable from "../components/DataTable";
import {
  KPIS,
  FERIAS_PROGRAMADAS,
  AFASTAMENTOS,
  INDICADORES_POR_FILIAL,
  INDICADORES_POR_GESTOR,
} from "../data/mock/dashboard";

export default function Dashboard() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard Executivo</h1>
          <div className="page-subtitle">Visão consolidada de indicadores de RH da Maxpesa</div>
        </div>
        <SourceTag path="SharePoint / RH / Indicadores / Dashboard_Executivo.xlsx" />
      </div>

      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        {KPIS.map((kpi) => (
          <div className="card kpi-card" key={kpi.label}>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
            <div className={`kpi-trend ${kpi.direction}`}>{kpi.trend}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 22 }}>
        <div className="card card-pad">
          <div className="section-title">Indicadores por filial</div>
          <DataTable
            columns={[
              { key: "filial", label: "Filial" },
              { key: "headcount", label: "Headcount" },
              { key: "turnover", label: "Turnover" },
              { key: "absenteismo", label: "Absenteísmo" },
            ]}
            rows={INDICADORES_POR_FILIAL}
            rowKey="filial"
          />
        </div>
        <div className="card card-pad">
          <div className="section-title">Indicadores por gestor</div>
          <DataTable
            columns={[
              { key: "gestor", label: "Gestor" },
              { key: "equipe", label: "Equipe" },
              { key: "headcount", label: "Headcount" },
              { key: "certificacoesValidas", label: "Certificações válidas" },
            ]}
            rows={INDICADORES_POR_GESTOR}
            rowKey="gestor"
          />
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card card-pad">
          <div className="section-title">Férias programadas</div>
          <DataTable
            columns={[
              { key: "colaborador", label: "Colaborador" },
              { key: "periodo", label: "Período" },
              { key: "diasSaldo", label: "Saldo (dias)" },
            ]}
            rows={FERIAS_PROGRAMADAS}
            rowKey="colaborador"
          />
        </div>
        <div className="card card-pad">
          <div className="section-title">Afastamentos ativos</div>
          <DataTable
            columns={[
              { key: "colaborador", label: "Colaborador" },
              { key: "tipo", label: "Tipo" },
              { key: "inicio", label: "Início" },
              { key: "previsaoRetorno", label: "Previsão de retorno" },
            ]}
            rows={AFASTAMENTOS}
            rowKey="colaborador"
          />
        </div>
      </div>
    </div>
  );
}
