import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione…",
  searchPlaceholder = "Buscar…",
}) {
  const [aberto, setAberto] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [abrirParaCima, setAbrirParaCima] = useState(false);
  const raizRef = useRef(null);
  const buscaRef = useRef(null);

  const selecionado = options.find((o) => String(o.value) === String(value));
  const opcoesFiltradas = filtro.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(filtro.trim().toLowerCase()))
    : options;

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e) {
      if (raizRef.current && !raizRef.current.contains(e.target)) setAberto(false);
    }
    function aoPressionarTecla(e) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoPressionarTecla);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    setFiltro("");
    const espacoAbaixo = window.innerHeight - raizRef.current.getBoundingClientRect().bottom;
    setAbrirParaCima(espacoAbaixo < 280 && raizRef.current.getBoundingClientRect().top > espacoAbaixo);
    requestAnimationFrame(() => buscaRef.current?.focus());
  }, [aberto]);

  return (
    <div className="searchable-select" ref={raizRef}>
      <button
        type="button"
        className="searchable-select-trigger"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
      >
        <span className={selecionado ? "" : "searchable-select-placeholder"}>
          {selecionado ? selecionado.label : placeholder}
        </span>
        <ChevronDown size={16} className={aberto ? "searchable-select-chevron open" : "searchable-select-chevron"} />
      </button>

      {aberto && (
        <div className={`searchable-select-panel${abrirParaCima ? " up" : ""}`}>
          <div className="searchable-select-search">
            <Search size={14} className="search-icon" />
            <input
              ref={buscaRef}
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>
          <ul className="searchable-select-list" role="listbox">
            {opcoesFiltradas.length === 0 && <li className="searchable-select-empty">Nenhum resultado</li>}
            {opcoesFiltradas.map((o) => (
              <li
                key={o.value}
                role="option"
                aria-selected={String(o.value) === String(value)}
                className={String(o.value) === String(value) ? "selected" : ""}
                onClick={() => {
                  onChange(o.value);
                  setAberto(false);
                }}
              >
                <span>{o.label}</span>
                {String(o.value) === String(value) && <Check size={14} />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
