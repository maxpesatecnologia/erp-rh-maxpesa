import { useState } from "react";
import { Camera, X, Plus } from "lucide-react";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

export const CAMPOS_OBRIGATORIOS = [
  "nome",
  "codigoDominio",
  "cargo",
  "departamento",
  "filial",
  "centroCusto",
  "admissao",
  "salario",
];

function apenasDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

function formatarCPF(valor) {
  const d = apenasDigitos(valor).slice(0, 11);
  const partes = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean);
  let resultado = partes.join(".");
  if (d.length > 9) resultado += `-${d.slice(9, 11)}`;
  return resultado;
}

// Validação oficial do dígito verificador do CPF (não só formato/tamanho) —
// pega CPF digitado errado ou aleatório antes de ir pro banco.
function cpfValido(valor) {
  const d = apenasDigitos(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calcularDigito = (base) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = calcularDigito(d.slice(0, 9));
  const d2 = calcularDigito(d.slice(0, 9) + d1);
  return d.slice(9) === `${d1}${d2}`;
}

function formatarCelular(valor) {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

// Salário exibido como moeda (R$ 3.000,00) — o valor guardado no estado é
// sempre o número puro (ex.: 3000), a formatação é só de exibição.
function formatarMoedaExibicao(valor) {
  if (valor === "" || valor === null || valor === undefined) return "";
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const ESTADO_INICIAL = {
  nome: "",
  codigoDominio: "",
  foto: null,
  cpf: "",
  celular: "",
  email: "",
  cargo: "",
  departamento: "",
  filial: "",
  centroCusto: "",
  gestor: "",
  admissao: "",
  salario: "",
  status: "Ativo",
  dataDesligamento: "",
  dependentesNomes: [],
  cnhNumero: "",
  cnhCategoria: "",
  cnhValidade: "",
  nrs: "",
  certificacoes: "",
  equipamentos: "",
};

// Converte um colaborador já carregado (formato usado pelas telas, com cnh
// como objeto e nrs/certificacoes como array) de volta pro formato plano do
// formulário — usado para pré-preencher a edição. `desligamento` é o registro
// de rh_desligamentos correspondente (se existir) — fonte da data exibida.
function paraFormulario(colaborador, desligamento) {
  if (!colaborador) return ESTADO_INICIAL;
  return {
    nome: colaborador.nome || "",
    codigoDominio: colaborador.codigoDominio || "",
    foto: colaborador.foto || null,
    cpf: formatarCPF(colaborador.cpf || ""),
    celular: formatarCelular(colaborador.celular || ""),
    email: colaborador.email || "",
    cargo: colaborador.cargo || "",
    departamento: colaborador.departamento || "",
    filial: colaborador.filial || "",
    centroCusto: colaborador.centroCusto || "",
    gestor: colaborador.gestor || "",
    admissao: colaborador.admissao || "",
    salario: colaborador.salario ?? "",
    status: colaborador.status || "Ativo",
    dataDesligamento: desligamento?.dataDesligamento || "",
    // Colaboradores antigos só têm a contagem (`dependentes`), sem nome — vira
    // essa quantidade de campos em branco pra poder nomear retroativamente.
    dependentesNomes: colaborador.dependentesNomes?.length
      ? colaborador.dependentesNomes
      : Array(colaborador.dependentes || 0).fill(""),
    cnhNumero: colaborador.cnh?.numero || "",
    cnhCategoria: colaborador.cnh?.categoria || "",
    cnhValidade: colaborador.cnh?.validade || "",
    nrs: (colaborador.nrs || []).join(", "),
    certificacoes: (colaborador.certificacoes || []).join(", "),
    equipamentos: (colaborador.equipamentos || []).join(", "),
  };
}

// `colaborador` presente = modo edição (pré-preenche e chama onSalvar com os
// dados atualizados); ausente = cadastro novo. `dadosIniciais` pré-preenche um
// cadastro novo (ex.: vindo da Admissão Digital) sem entrar em modo edição.
export default function NovoColaboradorForm({ colaborador, desligamento, dadosIniciais, onSalvar, onCancelar }) {
  const editando = Boolean(colaborador);
  const [dados, setDados] = useState(() =>
    editando ? paraFormulario(colaborador, desligamento) : { ...ESTADO_INICIAL, ...dadosIniciais }
  );
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function atualizar(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function atualizarDependente(indice, valor) {
    setDados((atual) => {
      const dependentesNomes = [...atual.dependentesNomes];
      dependentesNomes[indice] = valor;
      return { ...atual, dependentesNomes };
    });
  }

  function adicionarDependente() {
    setDados((atual) => ({ ...atual, dependentesNomes: [...atual.dependentesNomes, ""] }));
  }

  function removerDependente(indice) {
    setDados((atual) => ({
      ...atual,
      dependentesNomes: atual.dependentesNomes.filter((_, i) => i !== indice),
    }));
  }

  function handleFoto(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => atualizar("foto", leitor.result);
    leitor.readAsDataURL(arquivo);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const faltando = CAMPOS_OBRIGATORIOS.filter((campo) => !String(dados[campo]).trim());
    if (faltando.length > 0) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    if (dados.cpf.trim() && !cpfValido(dados.cpf)) {
      setErro("CPF inválido. Confira os números digitados.");
      return;
    }
    if (dados.celular.trim() && ![10, 11].includes(apenasDigitos(dados.celular).length)) {
      setErro("Celular inválido. Informe DDD + número (10 ou 11 dígitos).");
      return;
    }
    if (dados.status === "Desligado" && !dados.dataDesligamento) {
      setErro("Informe a data de demissão.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const dependentesNomes = dados.dependentesNomes.map((n) => n.trim()).filter(Boolean);
      await onSalvar({
        ...dados,
        dependentesNomes,
        dependentes: dependentesNomes.length,
        salario: Number(dados.salario) || 0,
      });
    } catch (err) {
      setErro(err.message || "Erro ao salvar colaborador.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="card card-pad" style={{ marginBottom: 18 }}>
      <div className="section-title">{editando ? `Editar colaborador — ${colaborador.nome}` : "Novo colaborador"}</div>
      <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 14 }}>
        {isSupabaseConfigured
          ? editando
            ? "Alterações gravadas direto na base de dados."
            : "Cadastro gravado direto na base de dados."
          : "Modo demonstração (sem Supabase configurado): alteração salva apenas nesta sessão, some ao recarregar a página."}
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
            <label htmlFor="nome">Nome completo *</label>
            <input
              id="nome"
              value={dados.nome}
              onChange={(e) => atualizar("nome", e.target.value)}
              placeholder="ex: Fernanda Costa Ribeiro"
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="codigoDominio">Código (Domínio Sistemas) *</label>
            <input
              id="codigoDominio"
              value={dados.codigoDominio}
              onChange={(e) => atualizar("codigoDominio", e.target.value)}
              placeholder="ex: DOM-10234"
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              value={dados.cpf}
              onChange={(e) => atualizar("cpf", formatarCPF(e.target.value))}
              inputMode="numeric"
              maxLength={14}
              placeholder="ex: 123.456.789-00"
            />
          </div>
          <div className="field-group">
            <label htmlFor="celular">Celular</label>
            <input
              id="celular"
              value={dados.celular}
              onChange={(e) => atualizar("celular", formatarCelular(e.target.value))}
              inputMode="numeric"
              maxLength={15}
              placeholder="ex: (11) 91234-5678"
            />
          </div>
          <div className="field-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={dados.email}
              onChange={(e) => atualizar("email", e.target.value)}
              placeholder="ex: nome@empresa.com"
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
            <label htmlFor="centroCusto">Centro de custo *</label>
            <input id="centroCusto" value={dados.centroCusto} onChange={(e) => atualizar("centroCusto", e.target.value)} required />
          </div>
          <div className="field-group">
            <label htmlFor="gestor">Gestor</label>
            <input id="gestor" value={dados.gestor} onChange={(e) => atualizar("gestor", e.target.value)} />
          </div>
          <div className="field-group">
            <label htmlFor="admissao">Data de admissão *</label>
            <input id="admissao" type="date" value={dados.admissao} onChange={(e) => atualizar("admissao", e.target.value)} required />
          </div>
          <div className="field-group">
            <label htmlFor="salario">Salário *</label>
            <input
              id="salario"
              type="text"
              inputMode="decimal"
              value={formatarMoedaExibicao(dados.salario)}
              onChange={(e) => {
                const digitos = apenasDigitos(e.target.value);
                atualizar("salario", digitos ? Number(digitos) / 100 : "");
              }}
              placeholder="R$ 0,00"
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="status">Situação</label>
            {dados.status === "Desligado" ? (
              <input id="status" value="Desligado" disabled title="Novos desligamentos são feitos pela ação “Desligar” na lista de colaboradores." />
            ) : (
              <select id="status" value={dados.status} onChange={(e) => atualizar("status", e.target.value)}>
                <option value="Ativo">Ativo</option>
                <option value="Afastado">Afastado</option>
              </select>
            )}
          </div>
          {dados.status === "Desligado" && (
            <div className="field-group">
              <label htmlFor="dataDesligamento">Data de demissão *</label>
              <input
                id="dataDesligamento"
                type="date"
                value={dados.dataDesligamento}
                onChange={(e) => atualizar("dataDesligamento", e.target.value)}
                required
              />
            </div>
          )}
          <div className="field-group">
            <label htmlFor="cnhNumero">CNH — número</label>
            <input id="cnhNumero" value={dados.cnhNumero} onChange={(e) => atualizar("cnhNumero", e.target.value)} placeholder="ex: 01234567890" />
          </div>
          <div className="field-group">
            <label htmlFor="cnhCategoria">CNH — tipo</label>
            <input id="cnhCategoria" value={dados.cnhCategoria} onChange={(e) => atualizar("cnhCategoria", e.target.value)} placeholder="ex: D" />
          </div>
          <div className="field-group">
            <label htmlFor="cnhValidade">CNH — vencimento</label>
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
          <div className="field-group" style={{ gridColumn: "span 3" }}>
            <label htmlFor="equipamentos">Equipamentos que opera (separados por vírgula)</label>
            <input
              id="equipamentos"
              value={dados.equipamentos}
              onChange={(e) => atualizar("equipamentos", e.target.value)}
              placeholder="ex: Escavadeira, Retroescavadeira, Munck"
            />
          </div>
        </div>

        <div className="field-group">
          <label>Dependentes</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dados.dependentesNomes.map((nome, indice) => (
              <div key={indice} style={{ display: "flex", gap: 8 }}>
                <input
                  value={nome}
                  onChange={(e) => atualizarDependente(indice, e.target.value)}
                  placeholder={`Nome do dependente ${indice + 1}`}
                  aria-label={`Nome do dependente ${indice + 1}`}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  aria-label={`Remover dependente ${indice + 1}`}
                  title="Remover dependente"
                  onClick={() => removerDependente(indice)}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline"
              style={{ alignSelf: "flex-start", padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={adicionarDependente}
            >
              <Plus size={14} /> Adicionar dependente
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={salvando}>
            {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Salvar colaborador"}
          </button>
          <button type="button" className="btn btn-outline" onClick={onCancelar} disabled={salvando}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
