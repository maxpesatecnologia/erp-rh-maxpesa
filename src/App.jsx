import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CadastroColaboradores from "./pages/colaboradores/CadastroColaboradores";
import PortalColaborador from "./pages/portal/PortalColaborador";
import Recrutamento from "./pages/recrutamento/Recrutamento";
import BancoCurriculos from "./pages/recrutamento/BancoCurriculos";
import AdmissaoDigital from "./pages/admissao/AdmissaoDigital";
import DesligamentoDigital from "./pages/desligamento/DesligamentoDigital";
import Treinamentos from "./pages/treinamentos/Treinamentos";
import AvaliacaoDesempenho from "./pages/avaliacao/AvaliacaoDesempenho";
import OperadoresEquipamentos from "./pages/operadores/OperadoresEquipamentos";
import SegurancaTrabalho from "./pages/seguranca/SegurancaTrabalho";
import MedicinaOcupacional from "./pages/medicina/MedicinaOcupacional";
import GestaoEPIs from "./pages/epis/GestaoEPIs";
import GestaoEquipes from "./pages/equipes/GestaoEquipes";
import ComunicacaoInterna from "./pages/comunicacao/ComunicacaoInterna";
import IACorporativa from "./pages/ia/IACorporativa";
import NotFound from "./pages/NotFound";

function withLayout(element) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={withLayout(<Dashboard />)} />
          <Route path="/colaboradores" element={withLayout(<CadastroColaboradores />)} />
          <Route path="/portal" element={withLayout(<PortalColaborador />)} />
          <Route path="/recrutamento" element={withLayout(<Recrutamento />)} />
          <Route path="/recrutamento/banco-curriculos" element={withLayout(<BancoCurriculos />)} />
          <Route path="/admissao" element={withLayout(<AdmissaoDigital />)} />
          <Route path="/desligamento" element={withLayout(<DesligamentoDigital />)} />
          <Route path="/treinamentos" element={withLayout(<Treinamentos />)} />
          <Route path="/avaliacao-desempenho" element={withLayout(<AvaliacaoDesempenho />)} />
          <Route path="/operadores" element={withLayout(<OperadoresEquipamentos />)} />
          <Route path="/seguranca" element={withLayout(<SegurancaTrabalho />)} />
          <Route path="/medicina" element={withLayout(<MedicinaOcupacional />)} />
          <Route path="/epis" element={withLayout(<GestaoEPIs />)} />
          <Route path="/equipes" element={withLayout(<GestaoEquipes />)} />
          <Route path="/comunicacao" element={withLayout(<ComunicacaoInterna />)} />
          <Route path="/ia" element={withLayout(<IACorporativa />)} />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <NotFound />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
