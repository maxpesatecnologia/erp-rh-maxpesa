import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { startSmoke, MAXPESA_RED } from "../lib/smokeShader";

// Fundo animado das telas logadas: a mesma fumaça vermelha do login, bem mais
// suave, passeando atrás dos cards. Renderiza em meia resolução, 30 fps e com
// menos camadas de ruído (a fumaça é borrada, não dá pra notar) pra pesar
// pouco na máquina.

// Intensidade por tema: no escuro o vermelho salta muito mais aos olhos
// sobre o preto, então lá a fumaça fica quase nula.
const GLOW = { light: 0.52, dark: 0.35 };
const FALLBACK_BASE = { light: [0.933, 0.941, 0.949], dark: [0.035, 0.035, 0.043] };

function mix(a, b, t) {
  return a.map((v, i) => v + (b[i] - v) * t);
}

function hexToRgb(hex) {
  const m = hex.trim().match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  return m ? m.slice(1).map((v) => parseInt(v, 16) / 255) : null;
}

// Lê a variável --color-bg direto (variáveis CSS não fazem transição), então
// a troca de tema aplica a cor certa no mesmo instante, sem esperar.
function readThemeColors() {
  const root = document.documentElement;
  const theme = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const base = hexToRgb(getComputedStyle(root).getPropertyValue("--color-bg")) ?? FALLBACK_BASE[theme];
  return {
    base,
    blush: mix(base, MAXPESA_RED, theme === "dark" ? 0.12 : 0.16),
    target: GLOW[theme],
  };
}

export default function SmokeBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const colors = readThemeColors();
    const state = { ...colors, glow: still ? colors.target : 0 };

    const stop = startSmoke(canvas, state, { rise: 1, scale: 0.5, fps: 30, octaves: 3, still });
    if (!stop) {
      canvas.style.display = "none";
      return undefined;
    }

    // Se acabou de logar, espera o overlay de boas-vindas sair antes de
    // acender — assim as duas fumaças não disputam a GPU ao mesmo tempo.
    const delay = document.querySelector(".welcome-overlay") ? 1.8 : 0;
    const tween = still ? null : gsap.to(state, { glow: state.target, duration: 1.6, delay, ease: "sine.out" });

    // Troca de tema: aplica na hora, sem fade.
    const observer = new MutationObserver(() => {
      tween?.kill();
      Object.assign(state, readThemeColors());
      state.glow = state.target;
      if (still) window.dispatchEvent(new Event("resize")); // redesenha o quadro parado
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      tween?.kill();
      observer.disconnect();
      stop();
    };
  }, []);

  return <canvas className="app-smoke" ref={canvasRef} aria-hidden="true" />;
}
