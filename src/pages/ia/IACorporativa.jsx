import { useState, useRef, useEffect } from "react";
import SourceTag from "../../components/SourceTag";
import { useAuth } from "../../context/AuthContext";
import { responder, SUGESTOES } from "../../lib/iaCorporativa";

export default function IACorporativa() {
  const { user } = useAuth();
  const [mensagens, setMensagens] = useState([
    { autor: "bot", texto: "Olá! Sou a IA Corporativa da Maxpesa. Pergunte sobre NRs, ASO, treinamentos, procedimentos ou operadores disponíveis." },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [mensagens]);

  function enviar(texto) {
    const pergunta = texto ?? input;
    if (!pergunta.trim()) return;
    const resposta = responder(pergunta, user);
    setMensagens((prev) => [...prev, { autor: "user", texto: pergunta }, { autor: "bot", texto: resposta }]);
    setInput("");
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>IA Corporativa</h1>
          <div className="page-subtitle">Respostas automáticas sobre NRs, ASO, treinamentos, procedimentos e equipes</div>
        </div>
        <SourceTag path="SharePoint (documentos) + Cadastro de Colaboradores/Operadores + Domínio Sistemas" />
      </div>

      <div className="card card-pad">
        <div className="ia-suggestions">
          {SUGESTOES.map((s) => (
            <button className="ia-suggestion-chip" key={s} onClick={() => enviar(s)}>
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
          </div>
          <div className="ia-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviar()}
              placeholder="Digite sua pergunta…"
            />
            <button className="btn btn-primary" onClick={() => enviar()}>
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
