import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { startSmoke } from "../lib/smokeShader";

// Tela de carregamento (checando a sessão): mesmo visual do "Olá! Seja
// bem-vindo" — fundo branco com fumaça vermelha — e o logo respirando no centro.
export default function AppLoading() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const state = { glow: still ? 1 : 0, base: [1, 1, 1], blush: [0.97, 0.62, 0.6] };
    const stop = startSmoke(canvasRef.current, state, {
      clearCenter: true,
      scale: 0.6,
      octaves: 5,
      still,
      fallbackClass: "welcome-canvas-fallback",
    });
    if (still) return stop;

    const ctx = gsap.context(() => {
      gsap.to(state, { glow: 1, duration: 1, ease: "sine.out" });
      gsap
        .timeline()
        .fromTo(
          ".app-loading-logo",
          { opacity: 0, scale: 0.96, filter: "blur(6px)" },
          { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.6, ease: "power3.out" },
        )
        .to(".app-loading-logo", {
          opacity: 0.6,
          scale: 0.985,
          duration: 1.1,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
    }, rootRef.current);

    return () => {
      ctx.revert();
      stop?.();
    };
  }, []);

  return (
    <div className="app-loading" ref={rootRef}>
      <canvas className="app-loading-canvas" ref={canvasRef} aria-hidden="true" />
      <img className="app-loading-logo" src="/maxpesa_logo_png.png" alt="Maxpesa" />
    </div>
  );
}
