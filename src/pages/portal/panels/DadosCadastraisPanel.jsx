import { useState } from "react";
import { Pencil, Check } from "lucide-react";
import { MEUS_DADOS_CADASTRAIS } from "../../../data/mock/portal";

function Field({ label, value, editing, onChange }) {
  return (
    <div className="field-group">
      <label>{label}</label>
      {editing ? (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="field-static">{value || "—"}</div>
      )}
    </div>
  );
}

export default function DadosCadastraisPanel() {
  const [dados, setDados] = useState(MEUS_DADOS_CADASTRAIS);
  const [rascunho, setRascunho] = useState(MEUS_DADOS_CADASTRAIS);
  const [editando, setEditando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  function editarSecao(secao, campo, valor) {
    setRascunho((prev) => ({ ...prev, [secao]: { ...prev[secao], [campo]: valor } }));
  }

  function iniciarEdicao() {
    setRascunho(dados);
    setEditando(true);
    setSalvo(false);
  }

  function salvar() {
    setDados(rascunho);
    setEditando(false);
    setSalvo(true);
  }

  function cancelar() {
    setRascunho(dados);
    setEditando(false);
  }

  const d = editando ? rascunho : dados;

  return (
    <div>
      <div className="panel-head">
        <div>
          <div className="section-title">Dados cadastrais</div>
          <div className="section-hint">Endereço, contato de emergência e dados bancários.</div>
        </div>
        {!editando && (
          <button className="btn btn-outline" onClick={iniciarEdicao}>
            <Pencil size={14} /> Editar
          </button>
        )}
      </div>

      {salvo && !editando && (
        <div className="inline-banner success">
          <Check size={14} /> Alterações salvas localmente. Em produção, isso é sincronizado com o Domínio Sistemas.
        </div>
      )}

      <div className="panel-fieldset">
        <div className="panel-fieldset-title">Endereço</div>
        <div className="form-grid">
          <Field label="Logradouro" value={d.endereco.logradouro} editing={editando} onChange={(v) => editarSecao("endereco", "logradouro", v)} />
          <Field label="Número" value={d.endereco.numero} editing={editando} onChange={(v) => editarSecao("endereco", "numero", v)} />
          <Field label="Bairro" value={d.endereco.bairro} editing={editando} onChange={(v) => editarSecao("endereco", "bairro", v)} />
          <Field label="Cidade" value={d.endereco.cidade} editing={editando} onChange={(v) => editarSecao("endereco", "cidade", v)} />
          <Field label="UF" value={d.endereco.uf} editing={editando} onChange={(v) => editarSecao("endereco", "uf", v)} />
          <Field label="CEP" value={d.endereco.cep} editing={editando} onChange={(v) => editarSecao("endereco", "cep", v)} />
        </div>
      </div>

      <div className="panel-fieldset">
        <div className="panel-fieldset-title">Contato de emergência</div>
        <div className="form-grid">
          <Field label="Nome" value={d.contatoEmergencia.nome} editing={editando} onChange={(v) => editarSecao("contatoEmergencia", "nome", v)} />
          <Field label="Parentesco" value={d.contatoEmergencia.parentesco} editing={editando} onChange={(v) => editarSecao("contatoEmergencia", "parentesco", v)} />
          <Field label="Telefone" value={d.contatoEmergencia.telefone} editing={editando} onChange={(v) => editarSecao("contatoEmergencia", "telefone", v)} />
        </div>
      </div>

      <div className="panel-fieldset">
        <div className="panel-fieldset-title">Dados bancários</div>
        <div className="form-grid">
          <Field label="Banco" value={d.dadosBancarios.banco} editing={editando} onChange={(v) => editarSecao("dadosBancarios", "banco", v)} />
          <Field label="Agência" value={d.dadosBancarios.agencia} editing={editando} onChange={(v) => editarSecao("dadosBancarios", "agencia", v)} />
          <Field label="Conta" value={d.dadosBancarios.conta} editing={editando} onChange={(v) => editarSecao("dadosBancarios", "conta", v)} />
          <Field label="Tipo de conta" value={d.dadosBancarios.tipoConta} editing={editando} onChange={(v) => editarSecao("dadosBancarios", "tipoConta", v)} />
          <Field label="Chave PIX" value={d.dadosBancarios.pix} editing={editando} onChange={(v) => editarSecao("dadosBancarios", "pix", v)} />
        </div>
      </div>

      {editando && (
        <div className="panel-actions">
          <button className="btn btn-primary" onClick={salvar}>
            Salvar alterações
          </button>
          <button className="btn btn-outline" onClick={cancelar}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
