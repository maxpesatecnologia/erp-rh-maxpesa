import { useState } from "react";
import { Camera, X } from "lucide-react";

const CAMPOS_OBRIGATORIOS = ["nome", "cargo", "departamento", "filial", "gestor", "admissao"];

const ESTADO_INICIAL = {
  nome: "",
  codigoDominio: "",
  foto: null,
  cargo: "",
  departamento: "",
  filial: "",
  centroCusto: "",
  gestor: "",
  equipe: "",
  admissao: "",
  escolaridade: "",
  dependentes: 0,
  cnhCategoria: "",
  cnhValidade: "",
  nrs: "",
  certificacoes: "",
};

export default function NovoColaboradorForm({ onCriar, onCancelar }) {
  const [dados, setDados] = useState(ESTADO_INICIAL);
  const [erro, setErro] = useState("");

  function atualizar(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function handleFoto(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => atualizar("foto", leitor.result);
    leitor.readAsDataURL(arquivo);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const faltando = CAMPOS_OBRIGATORIOS.filter((campo) => !String(dados[campo]).trim());
    if (faltando.length > 0) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    setErro("");
    onCriar({ ...dados, dependentes: Number(dados.dependentes) || 0 });
  }

  return (
    <div className="card card-pad" style={{ marginBottom: 18 }}>
      <div className="section-title">Novo colaborador</div>
      <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 14 }}>
        Cadastro salvo apenas nesta sessão (protótipo) — some ao recarregar a página. Em produção, isso grava
        direto na base real.
      </div>

      {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

      <form onSubmit={handleSubmit}>
        <div className="photo-upload">
          <label className={`photo-dropzone ${dados.foto ? "has-photo" : ""}`} title="Anexar foto do colaborador">
            {dados.foto ? <img src={dados.foto} alt="Prévia da foto" /> : <Camera size={22} />}
            <input type="file" accept="image/*" onChange={handleFoto} aria-label="Anexar foto do colaborador" />
          </label>
          <div className="photo-upload-hint">
            Foto do colaborador (opcional).
            {dados.foto && (
              <button type="button" onClick={() => atualizar("foto", null)} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <X size={12} /> Remover foto
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-3" style={{ gap: 12, marginBottom: 12 }}>
          <div className="field-group">
            <label htmlFor="nome">Nome *</label>
            <input id="nome" value={dados.nome} onChange={(e) => atualizar("nome", e.target.value)} required />
          </div>
          <div className="field-group">
            <label htmlFor="codigoDominio">Código (Domínio Sistemas)</label>
            <input
              id="codigoDominio"
              value={dados.codigoDominio}
              onChange={(e) => atualizar("codigoDominio", e.target.value)}
              placeholder="ex: DOM-10234"
            />
          </div>
          <div className="field-group">
            <label htmlFor="cargo">Cargo *</label>
            <input id="cargo" value={dados.cargo} onChange={(e) => atualizar("cargo", e.target.value)} required />
          </div>
          <div className="field-group">
            <label htmlFor="departamento">Departamento *</label>
            <input id="departamento" value={dados.departamento} onChange={(e) => atualizar("departamento", e.target.value)} required />
          </div>
          <div className="field-group">
            <label htmlFor="filial">Filial *</label>
            <input id="filial" value={dados.filial} onChange={(e) => atualizar("filial", e.target.value)} required />
          </div>
          <div className="field-group">
            <label htmlFor="centroCusto">Centro de custo</label>
            <input id="centroCusto" value={dados.centroCusto} onChange={(e) => atualizar("centroCusto", e.target.value)} />
          </div>
          <div className="field-group">
            <label htmlFor="gestor">Gestor *</label>
            <input id="gestor" value={dados.gestor} onChange={(e) => atualizar("gestor", e.target.value)} required />
          </div>
          <div className="field-group">
            <label htmlFor="equipe">Equipe</label>
            <input id="equipe" value={dados.equipe} onChange={(e) => atualizar("equipe", e.target.value)} />
          </div>
          <div className="field-group">
            <label htmlFor="admissao">Data de admissão *</label>
            <input id="admissao" type="date" value={dados.admissao} onChange={(e) => atualizar("admissao", e.target.value)} required />
          </div>
          <div className="field-group">
            <label htmlFor="escolaridade">Escolaridade</label>
            <input id="escolaridade" value={dados.escolaridade} onChange={(e) => atualizar("escolaridade", e.target.value)} />
          </div>
          <div className="field-group">
            <label htmlFor="dependentes">Dependentes</label>
            <input id="dependentes" type="number" min="0" value={dados.dependentes} onChange={(e) => atualizar("dependentes", e.target.value)} />
          </div>
          <div className="field-group">
            <label htmlFor="cnhCategoria">CNH — categoria</label>
            <input id="cnhCategoria" value={dados.cnhCategoria} onChange={(e) => atualizar("cnhCategoria", e.target.value)} placeholder="ex: D" />
          </div>
          <div className="field-group">
            <label htmlFor="cnhValidade">CNH — validade</label>
            <input id="cnhValidade" type="date" value={dados.cnhValidade} onChange={(e) => atualizar("cnhValidade", e.target.value)} />
          </div>
          <div className="field-group">
            <label htmlFor="nrs">NRs (separadas por vírgula)</label>
            <input id="nrs" value={dados.nrs} onChange={(e) => atualizar("nrs", e.target.value)} placeholder="ex: NR-35, NR-11" />
          </div>
          <div className="field-group" style={{ gridColumn: "span 2" }}>
            <label htmlFor="certificacoes">Certificações (separadas por vírgula)</label>
            <input id="certificacoes" value={dados.certificacoes} onChange={(e) => atualizar("certificacoes", e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" className="btn btn-primary">Salvar colaborador</button>
          <button type="button" className="btn btn-outline" onClick={onCancelar}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
