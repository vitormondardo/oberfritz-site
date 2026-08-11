/* =====================================================================
   OBERFRITZ — comportamento do site
   Ajuste os dados de contato em CONFIG (um lugar só, vale para o site todo)
   ===================================================================== */

const CONFIG = {
  whatsapp: "5547996176238",            // <<< TROCAR: DDI+DDD+número, só dígitos
  email: "oberfritz2026@gmail.com",    // <<< TROCAR
  instagram: "https://instagram.com/oberfritzz",
  linkedin: "www.linkedin.com/in/vitor-mondardo",
  github: "https://github.com/vitormondardo",
  mensagemPadrao: "Olá! Vim pelo site da OberFritz e quero entender como automatizar a operação da minha empresa."
};

const wppLink = (msg) =>
  `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg || CONFIG.mensagemPadrao)}`;

const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------------- */
/* Links de contato dinâmicos                                        */
/* ---------------------------------------------------------------- */
function aplicarContatos() {
  document.querySelectorAll("[data-wpp]").forEach((el) => {
    el.href = wppLink(el.dataset.wpp || "");
    el.target = "_blank";
    el.rel = "noopener";
  });
  document.querySelectorAll("[data-email]").forEach((el) => {
    el.href = "mailto:" + CONFIG.email;
    if (el.dataset.email === "texto") el.textContent = CONFIG.email;
  });
  const redes = { instagram: CONFIG.instagram, linkedin: CONFIG.linkedin, github: CONFIG.github };
  document.querySelectorAll("[data-rede]").forEach((el) => {
    el.href = redes[el.dataset.rede] || "#";
    el.target = "_blank";
    el.rel = "noopener";
  });
}

/* ---------------------------------------------------------------- */
/* Navegação                                                         */
/* ---------------------------------------------------------------- */
function iniciarNav() {
  const nav = document.querySelector(".nav");
  const burger = document.querySelector(".nav__burger");
  const sheet = document.querySelector(".nav__sheet");
  if (!nav) return;

  const temHero = !!document.querySelector(".hero");

  const atualizar = () => {
    // na home a nav só entra depois que o usuário começa a descer;
    // nas páginas internas ela já nasce visível
    nav.classList.toggle("is-visible", !temHero || window.scrollY > window.innerHeight * 0.5);
  };
  atualizar();
  window.addEventListener("scroll", atualizar, { passive: true });

  if (burger && sheet) {
    burger.addEventListener("click", () => {
      const aberto = sheet.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(aberto));
    });
    sheet.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        sheet.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      })
    );
  }
}

/* ---------------------------------------------------------------- */
/* HERO — o console expande até ocupar a tela conforme o scroll      */
/* ---------------------------------------------------------------- */
function iniciarHero() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const media = hero.querySelector(".hero__media");
  const titulo = hero.querySelector(".hero__title");
  const t1 = hero.querySelector(".t-1");
  const t2 = hero.querySelector(".t-2");
  const sub = hero.querySelector(".hero__sub");
  const scrollHint = hero.querySelector(".hero__scroll");
  const reveal = hero.querySelector(".hero__reveal");
  const chrome = hero.querySelector(".hero__chrome");

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function render() {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const total = hero.offsetHeight - vh;
    const y = Math.min(Math.max(-hero.getBoundingClientRect().top, 0), total);
    const p = total > 0 ? y / total : 0;

    // 0 → 0.72 : expansão da mídia
    const e = easeOut(Math.min(p / 0.72, 1));

    const largura0 = vw < 720 ? vw * 0.78 : vw * 0.44;
    const altura0 = vw < 720 ? vh * 0.26 : vh * 0.34;
    media.style.width = largura0 + (vw - largura0) * e + "px";
    media.style.height = altura0 + (vh - altura0) * e + "px";
    media.style.borderRadius = 3 * (1 - e) + "px";
    media.style.borderColor = `rgba(132,235,181,${0.22 * (1 - e)})`;
    if (chrome) chrome.style.opacity = String(1 - Math.min(e * 1.6, 1));

    // título se abre para os lados e some no fim
    const desl = vw < 720 ? 0 : Math.min(vw * 0.26, 420) * e;
    const opacidadeTitulo = 1 - Math.max((p - 0.5) / 0.22, 0);
    if (t1) t1.style.transform = `translateX(${-desl}px)`;
    if (t2) t2.style.transform = `translateX(${desl}px)`;
    if (vw < 720 && titulo) titulo.style.transform = `scale(${1 - 0.22 * e})`;
    if (titulo) titulo.style.opacity = String(Math.max(opacidadeTitulo, 0));
    if (sub) sub.style.opacity = String(Math.max(1 - p / 0.3, 0));
    if (scrollHint) scrollHint.style.opacity = String(Math.max(1 - p / 0.2, 0));

    // conteúdo final aparece quando a mídia já tomou a tela
    if (reveal) reveal.classList.toggle("is-on", p > 0.74);
  }

  render();
  let tick = false;
  const agendar = () => {
    if (tick) return;
    tick = true;
    requestAnimationFrame(() => {
      render();
      tick = false;
    });
  };
  window.addEventListener("scroll", agendar, { passive: true });
  window.addEventListener("resize", agendar);
}

/* ---------------------------------------------------------------- */
/* Render 3D em canvas: malha de nós (arquitetura de sistemas)       */
/* Projeção em perspectiva feita à mão — sem bibliotecas externas    */
/* ---------------------------------------------------------------- */
function iniciarMalha3D(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const N = 54;
  const R = 1;
  const nos = [];

  // distribuição de Fibonacci na esfera
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const yy = 1 - (i / (N - 1)) * 2;
    const raio = Math.sqrt(Math.max(1 - yy * yy, 0));
    const th = phi * i;
    nos.push({
      x: Math.cos(th) * raio * R,
      y: yy * R,
      z: Math.sin(th) * raio * R,
      f: 0.5 + Math.random()
    });
  }

  // arestas: cada nó liga aos 2 vizinhos mais próximos
  const arestas = [];
  for (let i = 0; i < N; i++) {
    const dist = [];
    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const d = (nos[i].x - nos[j].x) ** 2 + (nos[i].y - nos[j].y) ** 2 + (nos[i].z - nos[j].z) ** 2;
      dist.push([d, j]);
    }
    dist.sort((a, b) => a[0] - b[0]);
    for (let k = 0; k < 2; k++) {
      const j = dist[k][1];
      if (!arestas.some((a) => (a.a === j && a.b === i) || (a.a === i && a.b === j))) {
        arestas.push({ a: i, b: j });
      }
    }
  }

  // pacotes de dados percorrendo as conexões
  const pacotes = Array.from({ length: 16 }, () => ({
    e: Math.floor(Math.random() * arestas.length),
    t: Math.random(),
    v: 0.0025 + Math.random() * 0.004
  }));

  let W = 0, H = 0, dpr = 1;
  function medir() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = Math.max(r.width, 1);
    H = Math.max(r.height, 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  medir();
  window.addEventListener("resize", medir);

  let rodando = true;
  const io = new IntersectionObserver(
    ([ent]) => (rodando = ent.isIntersecting),
    { threshold: 0 }
  );
  io.observe(canvas);

  let mouseX = 0, mouseY = 0;
  window.addEventListener("pointermove", (ev) => {
    mouseX = (ev.clientX / window.innerWidth - 0.5) * 0.5;
    mouseY = (ev.clientY / window.innerHeight - 0.5) * 0.35;
  }, { passive: true });

  let tempo = 0;
  const proj = [];

  function quadro() {
    requestAnimationFrame(quadro);
    if (!rodando) return;
    tempo += reduzMovimento ? 0.0008 : 0.0038;

    const escala = Math.min(W, H) * 0.48;
    const cx = W / 2;
    const cy = H / 2;
    const yaw = tempo + mouseX;
    const pitch = Math.sin(tempo * 0.6) * 0.22 + mouseY;
    const cy1 = Math.cos(yaw), sy1 = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const dist = 3.4;

    for (let i = 0; i < N; i++) {
      const n = nos[i];
      let x = n.x * cy1 - n.z * sy1;
      let z = n.x * sy1 + n.z * cy1;
      let y = n.y * cp - z * sp;
      z = n.y * sp + z * cp;
      const k = 1 / (dist - z);
      proj[i] = { x: cx + x * escala * k * dist * 0.62, y: cy + y * escala * k * dist * 0.62, z, k };
    }

    ctx.clearRect(0, 0, W, H);

    // arestas
    for (const a of arestas) {
      const p1 = proj[a.a], p2 = proj[a.b];
      const prof = (p1.z + p2.z) / 2;
      const alpha = 0.08 + Math.max(prof + 1, 0) * 0.16;
      ctx.strokeStyle = `rgba(132,235,181,${alpha.toFixed(3)})`;
      ctx.lineWidth = prof > 0 ? 1.1 : 0.6;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // nós
    for (let i = 0; i < N; i++) {
      const p = proj[i];
      const frente = p.z > 0;
      const r = (frente ? 2.6 : 1.5) * (0.7 + nos[i].f * 0.5);
      const pulso = 0.5 + 0.5 * Math.sin(tempo * 2.4 + i);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = frente
        ? `rgba(194,239,91,${(0.35 + pulso * 0.5).toFixed(3)})`
        : `rgba(22,163,106,${(0.2 + pulso * 0.2).toFixed(3)})`;
      ctx.fill();
      if (frente && pulso > 0.85) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(194,239,91,0.05)";
        ctx.fill();
      }
    }

    // pacotes viajando
    for (const pk of pacotes) {
      pk.t += pk.v;
      if (pk.t > 1) {
        pk.t = 0;
        pk.e = Math.floor(Math.random() * arestas.length);
      }
      const ar = arestas[pk.e];
      const p1 = proj[ar.a], p2 = proj[ar.b];
      const x = p1.x + (p2.x - p1.x) * pk.t;
      const y = p1.y + (p2.y - p1.y) * pk.t;
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(242,255,247,.9)";
      ctx.fill();
    }
  }
  quadro();
}

/* ---------------------------------------------------------------- */
/* Carrossel 3D das entregas                                         */
/* ---------------------------------------------------------------- */
function iniciarCarrossel3D() {
  const box = document.querySelector(".carousel3d");
  if (!box) return;
  const palco = box.querySelector(".carousel3d__stage");
  const cards = [...palco.querySelectorAll(".card3d")];
  const n = cards.length;
  const passo = 360 / n;

  let raio = window.innerWidth < 720 ? 250 : 360;
  let rot = 0;
  let velocidade = 0.13;
  let arrastando = false;
  let xInicial = 0;
  let rotInicial = 0;

  function posicionar() {
    raio = window.innerWidth < 720 ? 250 : 360;
    cards.forEach((c, i) => {
      c.style.transform = `rotateY(${i * passo}deg) translateZ(${raio}px)`;
    });
  }
  posicionar();
  window.addEventListener("resize", posicionar);

  function marcarFrente() {
    let melhor = 0, menor = 999;
    cards.forEach((c, i) => {
      let ang = Math.abs(((i * passo + rot) % 360 + 360) % 360);
      ang = Math.min(ang, 360 - ang);
      if (ang < menor) { menor = ang; melhor = i; }
    });
    cards.forEach((c, i) => c.classList.toggle("is-front", i === melhor));
  }

  function girar() {
    requestAnimationFrame(girar);
    if (!arrastando && !box.matches(":hover")) rot += reduzMovimento ? 0 : velocidade;
    palco.style.transform = `translateZ(-${raio}px) rotateY(${rot}deg)`;
    marcarFrente();
  }
  girar();

  box.addEventListener("pointerdown", (ev) => {
    arrastando = true;
    xInicial = ev.clientX;
    rotInicial = rot;
    box.setPointerCapture(ev.pointerId);
  });
  box.addEventListener("pointermove", (ev) => {
    if (!arrastando) return;
    rot = rotInicial + (ev.clientX - xInicial) * 0.35;
  });
  const soltar = () => (arrastando = false);
  box.addEventListener("pointerup", soltar);
  box.addEventListener("pointercancel", soltar);
  box.addEventListener("pointerleave", soltar);
}

/* ---------------------------------------------------------------- */
/* Reveal ao rolar + brilho que segue o mouse nos cards              */
/* ---------------------------------------------------------------- */
function iniciarReveal() {
  const alvos = document.querySelectorAll(".rv");
  if (!alvos.length) return;
  const io = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  alvos.forEach((a) => io.observe(a));
}

function iniciarBrilho() {
  document.querySelectorAll(".prob").forEach((card) => {
    card.addEventListener("pointermove", (ev) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((ev.clientX - r.left) / r.width) * 100 + "%");
      card.style.setProperty("--my", ((ev.clientY - r.top) / r.height) * 100 + "%");
    });
  });
}

/* ---------------------------------------------------------------- */
/* Formulário de contato → abre o WhatsApp com a mensagem pronta     */
/* ---------------------------------------------------------------- */
function iniciarFormulario() {
  const form = document.querySelector("#form-contato");
  if (!form) return;
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const d = new FormData(form);
    const texto =
      `Olá, OberFritz! Meu nome é ${d.get("nome")}.\n` +
      `Empresa: ${d.get("empresa") || "—"}\n` +
      `E-mail: ${d.get("email") || "—"}\n` +
      `Preciso de: ${d.get("assunto")}\n\n` +
      `Contexto: ${d.get("mensagem")}`;
    window.open(wppLink(texto), "_blank", "noopener");
  });
}

/* ---------------------------------------------------------------- */
/* Ano no rodapé                                                     */
/* ---------------------------------------------------------------- */
function anoAtual() {
  document.querySelectorAll("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));
}

/* ---------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  aplicarContatos();
  iniciarNav();
  iniciarHero();
  iniciarMalha3D(document.querySelector("#malha3d"));
  iniciarCarrossel3D();
  iniciarReveal();
  iniciarBrilho();
  iniciarFormulario();
  anoAtual();
});
