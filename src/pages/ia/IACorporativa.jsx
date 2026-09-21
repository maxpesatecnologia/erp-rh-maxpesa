import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { responder, SUGESTOES } from "../../lib/iaCorporativa";

export default function IACorporativa() {
  const { user } = useAuth();
  const [mensagens, setMensagens] = useState([
    {
      autor: "bot",
      texto:
        "Olá! Eu sou o Max, a IA da Maxpesa. Posso ajudar com assuntos de RH/DP: admissão, documentos, férias, desligamento, cadastro, benefícios ou avaliação de desempenho.",
    },
  ]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [mensagens, enviando]);

  async function enviar(texto) {
    const pergunta = texto ?? input;
    if (!pergunta.trim() || enviando) return;

    const historico = mensagens.slice(1); // sem a saudação inicial
    setMensagens((prev) => [...prev, { autor: "user", texto: pergunta }]);
    setInput("");
    setEnviando(true);

    try {
      const resposta = await responder(pergunta, user, historico);
      setMensagens((prev) => [...prev, { autor: "bot", texto: resposta }]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Max — IA da Maxpesa</h1>
          <div className="page-subtitle">Respostas e ajuda prática sobre RH e Departamento Pessoal (RH/DP)</div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="ia-suggestions">
          {SUGESTOES.map((s) => (
            <button className="ia-suggestion-chip" key={s} onClick={() => enviar(s)} disabled={enviando}>
              {s}
            </button>
          ))}
        </div>

        <div className="ia-chat">
          <div className="ia-messages" ref={scrollRef}>
            {mensagens.map((m, i) => (
              <div className={`ia-msg ${m.autor}`} key={i}>
                {m.texto}
              </div>
            ))}
            {enviando && <div className="ia-msg bot ia-msg-loading">Digitando…</div>}
          </div>
          <div className="ia-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviar()}
              placeholder="Digite sua pergunta sobre RH/DP…"
              disabled={enviando}
            />
            <button className="btn btn-primary" onClick={() => enviar()} disabled={enviando}>
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
