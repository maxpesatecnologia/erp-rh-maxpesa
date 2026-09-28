import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { startSmoke } from "../lib/smokeShader";

// Transições de login/logout: um overlay de tela cheia (fundo em WebGL)
// escreve "Olá! Seja bem-vindo, Nome." (ou, na saída, um "Até logo, Nome."
// mais curto) e, depois que a rota muda por baixo dele, some com fade
// revelando a tela nova. Mora acima das <Routes> pra sobreviver à troca de
// página (a tela de origem desmonta no meio da animação).

const WelcomeContext = createContext(null);

export function WelcomeTransitionProvider({ children }) {
  const [session, setSession] = useState(null); // { variant, name, onReady, key }

  // Toca a animação; `onReady` é chamado quando o texto terminou de aparecer
  // — é o momento de navegar, pra tela nova já estar montada no fade-out.
  const playWelcome = useCallback((name, onReady) => {
    setSession({ variant: "welcome", name, onReady, key: Date.now() });
  }, []);

  const playGoodbye = useCallback((name, onReady) => {
    setSession({ variant: "goodbye", name, onReady, key: Date.now() });
  }, []);

  return (
    <WelcomeContext.Provider value={{ playWelcome, playGoodbye }}>
      {children}
      {session && (
        <WelcomeOverlay
          key={session.key}
          variant={session.variant}
          name={session.name}
          onReady={session.onReady}
          onDone={() => setSession(null)}
        />
      )}
    </WelcomeContext.Provider>
  );
}

export function useWelcomeTransition() {
  const ctx = useContext(WelcomeContext);
  if (!ctx) throw new Error("useWelcomeTransition precisa estar dentro de <WelcomeTransitionProvider>");
  return ctx;
}

// "joao.silva@maxpesa.com.br" -> "Joao"; usado só quando o perfil não tem nome.
export function firstNameFrom(nome, email) {
  const fromNome = nome?.trim().split(/\s+/)[0];
  if (fromNome) return capitalize(fromNome);
  const local = email?.split("@")[0]?.split(/[._-]/)[0]?.replace(/\d+$/, "");
  return local ? capitalize(local) : "";
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// Quebra em palavras (que não se partem no meio) e letras (que animam uma a uma).
function SplitText({ text, className }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((word, wi, words) => (
        <span className="welcome-word" key={wi} aria-hidden="true">
          {[...word].map((ch, ci) => (
            <span className="welcome-char" key={ci}>{ch}</span>
          ))}
          {wi < words.length - 1 && <span className="welcome-char">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

function WelcomeOverlay({ variant, name, onReady, onDone }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  // Estado lido pelo shader a cada quadro; o GSAP anima `glow` (intensidade da fumaça).
  const glow = useRef({ glow: 0, base: [1, 1, 1], blush: [0.97, 0.62, 0.6] });
  const callbacks = useRef({ onReady, onDone });
  callbacks.current = { onReady, onDone };

  useEffect(
    () => startSmoke(canvasRef.current, glow.current, { clearCenter: true, scale: 0.6, octaves: 5, fallbackClass: "welcome-canvas-fallback" }),
    [],
  );

  useEffect(() => {
    const root = rootRef.current;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const hello = root.querySelectorAll(".welcome-hello .welcome-char");
      const line = root.querySelectorAll(".welcome-line .welcome-word");
      const tl = gsap.timeline({ onComplete: () => callbacks.current.onDone() });

      if (reduced) {
        tl.set(glow.current, { glow: 1 })
          .fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.25 })
          .call(() => callbacks.current.onReady?.(), null, variant === "goodbye" ? "+=0.5" : "+=0.9")
          .to(root, { opacity: 0, duration: 0.35 }, "+=0.2");
        return;
      }

      if (variant === "goodbye") {
        // Versão enxuta: palavras inteiras em vez de letra a letra, ~2s no total.
        tl.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" })
          .to(glow.current, { glow: 1, duration: 0.9, ease: "sine.out" }, 0)
          .fromTo(
            root.querySelectorAll(".welcome-hello .welcome-word"),
            { opacity: 0, y: 10, filter: "blur(6px)" },
            { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power3.out", stagger: 0.08 },
            0.15,
          )
          .fromTo(
            ".welcome-rule",
            { scaleX: 0, opacity: 0 },
            { scaleX: 1, opacity: 1, duration: 0.5, ease: "power2.inOut" },
            "-=0.3",
          )
          .call(() => callbacks.current.onReady?.(), null, "+=0.35")
          .to(
            ".welcome-content",
            { opacity: 0, y: -10, filter: "blur(4px)", duration: 0.4, ease: "power2.in" },
            "+=0.15",
          )
          .to(glow.current, { glow: 0, duration: 0.5, ease: "sine.in" }, "<")
          .to(root, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, "-=0.2");
        return;
      }

      // ~3s no total: rápido o bastante pra não parecer espera.
      tl.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out" })
        .to(glow.current, { glow: 1, duration: 1.2, ease: "sine.out" }, 0)
        .fromTo(
          hello,
          { opacity: 0, y: 16, filter: "blur(8px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out", stagger: 0.05 },
          0.2,
        )
        .fromTo(
          line,
          { opacity: 0, y: 10, filter: "blur(6px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out", stagger: 0.06 },
          "-=0.4",
        )
        .fromTo(
          ".welcome-rule",
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.6, ease: "power2.inOut" },
          "-=0.4",
        )
        // Hora de trocar a rota por baixo do overlay.
        .call(() => callbacks.current.onReady?.(), null, "+=0.4")
        .to(
          ".welcome-content",
          { opacity: 0, y: -12, filter: "blur(4px)", duration: 0.5, ease: "power2.in" },
          "+=0.1",
        )
        .to(glow.current, { glow: 0, duration: 0.6, ease: "sine.in" }, "<")
        .to(root, { opacity: 0, duration: 0.6, ease: "power2.inOut" }, "-=0.3");
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div className="welcome-overlay" ref={rootRef} role="status" aria-live="polite">
      <canvas className="welcome-canvas" ref={canvasRef} aria-hidden="true" />
      <div className="welcome-content">
        {variant === "goodbye" ? (
          <SplitText className="welcome-hello" text={name ? `Até logo, ${name}.` : "Até logo."} />
        ) : (
          <>
            <SplitText className="welcome-hello" text="Olá!" />
            <SplitText className="welcome-line" text={name ? `Seja bem-vindo, ${name}.` : "Seja bem-vindo."} />
          </>
        )}
        <span className="welcome-rule" aria-hidden="true" />
      </div>
    </div>
  );
}
