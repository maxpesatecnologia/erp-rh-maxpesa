// Fumaça vermelha Maxpesa em WebGL, usada no overlay de login/logout e no
// fundo animado das telas logadas. `state` é um objeto mutável lido a cada
// quadro — dá pra animar `glow` com GSAP ou trocar as cores quando o tema muda.
//
//   state: { glow: 0..1, base: [r,g,b], blush: [r,g,b] }
//   options:
//     rise      0 = fumaça parada no lugar; 1 = fundo vivo (sobe, desce e passeia)
//     clearCenter  fumaça só em cima e embaixo, equilibrada, centro limpo (overlay)
//     scale     resolução do canvas relativa à tela (a fumaça é borrada, dá pra ser baixa)
//     fps       limite de quadros por segundo
//     still     desenha um único quadro e para (prefers-reduced-motion)
//     octaves   camadas de ruído (menos = mais leve; 3 já basta atrás dos cards)
//
// Enquanto state.glow estiver em 0 o shader não redesenha (o quadro vazio já
// está na tela), então um fundo "apagado" não custa nada.

export const MAXPESA_RED = [0.886, 0.137, 0.102];

const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_glow;
uniform float u_rise;
uniform float u_clear;
uniform vec3 u_base;
uniform vec3 u_blush;

const vec3 RED = vec3(0.886, 0.137, 0.102);

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < OCTAVES; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  float t = u_time * 0.06 * (1.0 + 0.9 * u_rise + 1.4 * u_clear);

  // Com o centro limpo (overlay), a metade de baixo é a de cima girada 180°:
  // garante fumaça equilibrada nos dois lados.
  vec2 sp = (u_clear > 0.5 && p.y < 0.0) ? -p : p;

  // Overlay: a fumaça escorre pra fora a partir do centro (em cima sobe,
  // embaixo desce, por causa do giro) e ondula de leve pros lados.
  sp.y -= u_clear * u_time * 0.07;
  sp.x += u_clear * sin(u_time * 0.35 + sp.y * 2.2) * 0.06;

  // Sobe e desce: uma onda lenta no eixo vertical + um leve fluxo pra cima.
  sp.y -= u_rise * (sin(u_time * 0.12) * 0.25 + u_time * 0.025);
  sp.x += u_rise * sin(u_time * 0.09 + sp.y * 1.3) * 0.14;

  // Domain warping: a fumaça "respira" e se deforma sozinha.
  vec2 q = vec2(fbm(sp * 1.4 + t), fbm(sp * 1.4 - t + 3.1));
  // No overlay o warp é mais forte: fiapos e redemoinhos de fumaça.
  float n = fbm(sp * 1.8 + q * (1.6 + 0.9 * u_clear) + vec2(t * 0.7, -t * 0.4));

  // "Puffs" que passeiam pela tela, cada um num ritmo e caminho próprios
  // (curvas de Lissajous) — a fumaça adensa aqui, rarefaz ali.
  float halfW = 0.5 * u_res.x / min(u_res.x, u_res.y);
  float halfH = 0.5 * u_res.y / min(u_res.x, u_res.y);
  float live = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float T = u_time * (0.05 + 0.017 * fi);
    vec2 c = vec2(sin(T * 1.3 + fi * 1.7) * halfW * 0.85,
                  cos(T * 0.9 + fi * 2.9) * halfH * 0.8);
    vec2 d = p - c;
    live += exp(-dot(d, d) * (5.0 + 1.5 * sin(u_time * 0.2 + fi)));
  }
  n += u_rise * (min(live, 1.0) * 0.34 - 0.2);

  // Faixas em cima e embaixo, sumindo suave até o meio (onde fica o texto).
  float band = mix(1.0, smoothstep(0.02, 0.26, abs(p.y)), u_clear);
  // No overlay o limiar é mais baixo: fumaça mais presente e densa.
  float smoke = smoothstep(0.38 - 0.12 * u_clear, 0.95 - 0.1 * u_clear, n) * u_glow * band;
  float edge = mix(1.0, band, u_clear);

  vec3 col = u_base;
  col = mix(col, u_blush, smoke * (0.5 + 0.4 * edge));
  col = mix(col, RED, pow(smoke, 1.8) * (0.28 + 0.42 * edge));

  // Grão sutil pra não formar banding.
  col += (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.012;

  gl_FragColor = vec4(col, 1.0);
}
`;

// Retorna a função de limpeza, ou undefined se não houver WebGL (aí o canvas
// ganha a classe `fallbackClass` pra um gradiente em CSS assumir).
export function startSmoke(canvas, state, options = {}) {
  const { rise = 0, clearCenter = false, scale = 1, fps = 60, still = false, octaves = 5, fallbackClass } = options;

  const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
  const fail = () => {
    if (fallbackClass) canvas.classList.add(fallbackClass);
    return undefined;
  };
  if (!gl) return fail();

  const program = gl.createProgram();
  const fragment = `#define OCTAVES ${octaves}\n${FRAGMENT}`;
  for (const [type, src] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, fragment]]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return fail();
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = (name) => gl.getUniformLocation(program, name);
  const uRes = u("u_res");
  const uTime = u("u_time");
  const uGlow = u("u_glow");
  const uBase = u("u_base");
  const uBlush = u("u_blush");
  gl.uniform1f(u("u_rise"), rise);
  gl.uniform1f(u("u_clear"), clearCenter ? 1 : 0);

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * scale;
    canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (still) draw(performance.now());
  }

  const start = performance.now();
  function draw(now) {
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - start) / 1000 + 20);
    gl.uniform1f(uGlow, state.glow);
    gl.uniform3fv(uBase, state.base);
    gl.uniform3fv(uBlush, state.blush);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  let raf = 0;
  let last = 0;
  let drewEmpty = false;
  const minDelta = 1000 / fps;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden || now - last < minDelta) return;
    if (state.glow < 0.001 && drewEmpty) return;
    drewEmpty = state.glow < 0.001;
    last = now;
    draw(now);
  }

  resize();
  window.addEventListener("resize", resize);
  if (still) draw(start);
  else raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  };
}
