import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

function iniciais(nome) {
  return nome
    ? nome
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : "?";
}

export default function Avatar({ nome, foto, size = 32 }) {
  const [expandida, setExpandida] = useState(false);

  useEffect(() => {
    if (!expandida) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") setExpandida(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandida]);

  if (!foto) {
    return (
      <div className="avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.38 }}>
        {iniciais(nome)}
      </div>
    );
  }

  return (
    <>
      <img
        src={foto}
        alt={nome}
        className="avatar-img avatar-clickable"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
        role="button"
        tabIndex={0}
        title={`Ampliar foto de ${nome}`}
        onClick={() => setExpandida(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpandida(true);
          }
        }}
      />
      {expandida &&
        createPortal(
          <div className="avatar-lightbox-backdrop" onClick={() => setExpandida(false)}>
            <button
              type="button"
              className="avatar-lightbox-close"
              onClick={() => setExpandida(false)}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
            <img
              src={foto}
              alt={nome}
              className="avatar-lightbox-img"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body
        )}
    </>
  );
}
