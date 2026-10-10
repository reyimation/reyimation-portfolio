import "./styles.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { CustomEase } from "gsap/CustomEase";
import Lenis from "lenis";
import { SITE, WORKS, SERVICES, PROCESS, TOOLS, type Work, type Category } from "./content";
import { wordmark, draw, drawDuration } from "./wordmark";
import { parseVideo } from "./embed";

gsap.registerPlugin(ScrollTrigger, Flip, CustomEase);

// Kit motion curves.
CustomEase.create("trace", "0.6, 0, 0.2, 1"); // things drawing / wiping in along their path
CustomEase.create("rise", "0.2, 0.8, 0.2, 1"); // content arriving
CustomEase.create("pop", "0.3, 1.6, 0.5, 1"); // the play button landing

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll(sel)) as T[];
const navH = () => $(".nav").getBoundingClientRect().height;

const FPS = 25;
const pad = (n: number) => String(n).padStart(2, "0");
function timecode(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds * FPS));
  const s = Math.floor(total / FPS);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(total % FPS)}`;
}

// Kit player timecode: counts from 00:00:00:00 and holds at 00:00:03:00 (75 frames). A new run cancels the old one.
function runTimecode(el: HTMLElement) {
  const run = String(Number(el.dataset.run ?? 0) + 1);
  el.dataset.run = run;
  const t0 = performance.now();
  const tick = () => {
    if (el.dataset.run !== run) return;
    const f = Math.min(75, Math.floor((performance.now() - t0) / 40));
    el.textContent = `00:00:${pad(Math.floor(f / FPS))}:${pad(f % FPS)}`;
    if (f < 75) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// A draw that is still running is never restarted, so a second trigger can't cut it off halfway.
const drawingUntil = new WeakMap<Element, number>();
function playMark(container: Element, speed = 1) {
  if (reduced) return container.classList.remove("pre");
  const now = performance.now();
  if ((drawingUntil.get(container) ?? 0) > now) return;
  drawingUntil.set(container, now + drawDuration(speed) * 1000);
  draw(container, speed);
}

// Phones resize the viewport as the address bar slides; don't re-measure (and re-fire triggers) for that.
ScrollTrigger.config({ ignoreMobileResize: true });

/* ================================================================ */
/* Static content (built once)                                      */
/* ================================================================ */

$$("[data-wordmark]").forEach((el) => {
  el.innerHTML = wordmark();
  if (el.hasAttribute("data-draw") && !reduced) el.classList.add("pre");
});
$$("[data-email]").forEach((el) => (el.textContent = SITE.email));
$("[data-location]").textContent = SITE.location;
$("[data-year]").textContent = String(new Date().getFullYear());
$<HTMLAnchorElement>("[data-mailto]").href = `mailto:${SITE.email}?subject=${encodeURIComponent("New project for Reyimation")}`;

const cv = $<HTMLAnchorElement>("[data-cv]");
if (SITE.cv) Object.assign(cv, { href: SITE.cv, target: "_blank", rel: "noopener", hidden: false });

const socials = SITE.socials.filter((s) => s.url);
const socialList = $("[data-socials]");
if (socials.length) socialList.innerHTML = socials.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join("");
else socialList.remove();

$("[data-tools]").innerHTML = TOOLS.map(
  (t) => `<li data-reveal><span class="label">${t.use}</span><div><b>${t.name}</b><p>${t.body}</p></div></li>`,
).join("");

/* ---------------- Routes ---------------- */

type Route = "home" | "work" | "services" | "process" | "about";
const ROUTES: Record<Route, { title: string; num: string; sub: string; theme: "light" | "dark" }> = {
  home: { title: "Reyimation", num: "00", sub: "", theme: "dark" },
  work: { title: "Work", num: "01", sub: "Brand films, YouTube edits, motion and short-form.", theme: "light" },
  services: { title: "Services", num: "02", sub: "Editing, motion graphics, short-form, colour and sound.", theme: "dark" },
  process: { title: "Process", num: "03", sub: "From brief to delivery, frame by frame.", theme: "dark" },
  about: { title: "About", num: "04", sub: "The edit suite, the tools and how I work.", theme: "light" },
};

$("[data-chapters]").innerHTML = (["work", "services", "process", "about"] as Route[])
  .map((r) => `<li data-reveal><a href="#/${r}"><span class="label">${ROUTES[r].num}</span><b>${ROUTES[r].title}</b><span class="chapters__arrow" aria-hidden="true">→</span><span class="sub">${ROUTES[r].sub}</span></a></li>`)
  .join("");

/* ---------------- Work grid ---------------- */

function rand(seed: number) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

function poster(w: Work, i: number): string {
  if (w.poster) return `<img src="${w.poster}" alt="" loading="lazy">`;
  const r = rand(i + 3);
  const bars = Array.from({ length: 30 }, (_, k) => `<i style="height:${Math.min(100, 18 + Math.round(Math.abs(Math.sin(k * 0.5 + i)) * 60 + r() * 22))}%"></i>`).join("");
  return `<div class="poster"><span class="poster__top label">${pad(i + 1)} · ${w.category}</span><p class="poster__title">${w.title}</p><div class="poster__wave">${bars}</div></div>`;
}

const grid = $("[data-works]");
grid.innerHTML = WORKS.map((w, i) => {
  const preview = w.preview ? `<video src="${w.preview}" muted loop playsinline preload="none"></video>` : "";
  return `<div class="card${i === 0 ? " is-lead" : ""}" data-cat="${w.category}" data-i="${i}" tabindex="0" role="button" aria-label="Play ${w.title}">
    <div class="card__in" data-reveal>
      <div class="card__media">${poster(w, i)}${preview}<span class="card__dur tc">${w.duration}</span><span class="card__play" aria-hidden="true"><i></i></span></div>
      <div class="card__body"><div><h3 class="card__title">${w.title}</h3><p class="card__sub">${w.client} · ${w.year}</p></div><span class="card__cat label">${w.category}</span></div>
    </div>
  </div>`;
}).join("");

const cards = $$(".card", grid);
cards.forEach((card) => {
  const w = WORKS[Number(card.dataset.i)];
  const open = () => openVideo(w.title, `${w.client} · ${w.year} · ${w.duration}`, w.video);
  card.addEventListener("click", open);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
  });
  const vid = $<HTMLVideoElement>("video", card);
  const bars = $$(".poster__wave i", card);
  let wave: gsap.core.Tween | null = null;
  card.addEventListener("mouseenter", () => {
    if (vid) { card.classList.add("is-playing"); vid.play().catch(() => {}); }
    if (bars.length && !reduced) {
      wave = gsap.to(bars, { scaleY: () => gsap.utils.random(0.4, 1.3), duration: 0.32, ease: "sine.inOut", stagger: { each: 0.012, from: "random" }, repeat: -1, yoyo: true, repeatRefresh: true });
    }
  });
  card.addEventListener("mouseleave", () => {
    if (vid) { card.classList.remove("is-playing"); vid.pause(); }
    wave?.kill();
    if (bars.length) gsap.to(bars, { scaleY: 1, duration: 0.4, ease: "power2.out" });
  });
});

// Filters. Cards that stay slide to their new place; new ones rise in; leaving ones go at once,
// so nothing dark lingers on screen and the page height settles immediately.
const cats: ("All" | Category)[] = ["All", ...new Set(WORKS.map((w) => w.category))];
const filters = $("[data-filters]");
filters.innerHTML = cats.map((c, i) => `<button type="button" aria-pressed="${i === 0}">${c}</button>`).join("");
$$<HTMLButtonElement>("button", filters).forEach((btn) =>
  btn.addEventListener("click", () => {
    if (btn.getAttribute("aria-pressed") === "true") return;
    const cat = btn.textContent as "All" | Category;
    $$("button", filters).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    $$(".card__in.below", grid).forEach((el) => el.classList.remove("below"));
    const state = Flip.getState(cards);
    cards.forEach((c, i) => {
      c.classList.toggle("is-hidden", cat !== "All" && c.dataset.cat !== cat);
      c.classList.toggle("is-lead", cat === "All" && i === 0);
    });
    ScrollTrigger.refresh();
    if (reduced) return;
    Flip.from(state, {
      duration: 0.7,
      ease: "trace",
      onEnter: (els) => gsap.fromTo(els, { y: 40 }, { y: 0, duration: 1, ease: "rise", clearProps: "transform" }),
    });
  }),
);

/* ---------------- Services ---------------- */

function serviceVisual(kind: string): string {
  if (kind === "clips") {
    const rows = [[3, 5, 2, 4], [6, 3, 4], [2, 4, 3, 5, 2]];
    return `<div class="vis-clips">${rows
      .map((row, ri) => `<div>${row.map((f, ci) => `<span style="flex:${f}"${ri === 1 && ci === 1 ? ' class="hot"' : ""}></span>`).join("")}</div>`)
      .join("")}</div>`;
  }
  if (kind === "player") {
    return `<div class="vis-player"><span class="tc" data-player-tc>00:00:00:00</span><div class="vis-player__wm${reduced ? "" : " pre"}">${wordmark()}</div><button class="vis-player__replay" type="button">Replay</button></div>`;
  }
  if (kind === "phone") return `<div class="vis-phone"><span></span><span class="hot"></span><span></span></div>`;
  return `<div class="vis-wave">${Array.from({ length: 44 }, (_, k) => `<i style="height:${20 + Math.round(Math.abs(Math.sin(k * 0.7)) * 70)}%"></i>`).join("")}</div>`;
}

const track = $("[data-services]");
track.innerHTML = SERVICES.map(
  (s) => `<article class="svc"><span class="svc__code label">${s.code} / ${pad(SERVICES.length)}</span>
    <div class="svc__vis">${serviceVisual(s.visual)}</div>
    <div><h3>${s.title}</h3><p>${s.body}</p><ul class="svc__tags">${s.tags.map((t) => `<li>${t}</li>`).join("")}</ul></div></article>`,
).join("");
const svcs = $$(".svc", track);

function playPlayer(svc: HTMLElement) {
  const wm = $(".vis-player__wm", svc);
  if (!wm) return;
  playMark(wm);
  runTimecode($("[data-player-tc]", svc));
}
$$(".vis-player__replay", track).forEach((b) => b.addEventListener("click", () => playPlayer(b.closest(".svc") as HTMLElement)));

function animateServiceVisual(svc: HTMLElement) {
  gsap.to($$(".vis-clips span", svc), { scaleX: 1, duration: 1.1, ease: "trace", stagger: 0.06 });
  gsap.to($$(".vis-phone span", svc), { clipPath: "inset(0% 0% 0% 0% round 12px)", duration: 1.1, ease: "trace", stagger: 0.09 });
  gsap.to($$(".vis-wave i", svc), { scaleY: 1, duration: 1.1, ease: "trace", stagger: { each: 0.015, from: "center" } });
  playPlayer(svc);
}

/* ---------------- Process timeline ---------------- */

const TL_SECONDS = 60;
$("[data-ruler]").innerHTML = Array.from({ length: TL_SECONDS + 1 }, (_, s) => {
  const left = (s / TL_SECONDS) * 100;
  const label = s % 10 === 0 && s < TL_SECONDS ? `<span style="left:${left}%">00:${pad(s)}</span>` : "";
  return `<i class="${s % 5 === 0 ? "major" : ""}" style="left:${left}%"></i>${label}`;
}).join("");

type Clip = { lane: "v1" | "v2" | "a1"; from: number; to: number; label: string; kind?: "gfx" | "audio" };
const clips: Clip[] = [
  ...PROCESS.map((p, i) => ({ lane: "v1" as const, from: p.at + 0.004, to: (PROCESS[i + 1]?.at ?? 1) - 0.004, label: `${pad(i + 1)} ${p.title}` })),
  { lane: "v2", from: 0.27, to: 0.42, label: "Titles", kind: "gfx" },
  { lane: "v2", from: 0.53, to: 0.68, label: "Lower thirds", kind: "gfx" },
  { lane: "v2", from: 0.78, to: 0.97, label: "Captions", kind: "gfx" },
  { lane: "a1", from: 0.02, to: 0.49, label: "", kind: "audio" },
  { lane: "a1", from: 0.505, to: 0.985, label: "", kind: "audio" },
];
const clipEls = clips.map((c, ci) => {
  const el = document.createElement("div");
  el.className = `clip${c.kind ? ` clip--${c.kind}` : ""}`;
  el.style.left = `${c.from * 100}%`;
  el.style.width = `${(c.to - c.from) * 100}%`;
  if (c.kind === "audio") {
    const r = rand(ci + 11);
    el.innerHTML = Array.from({ length: 60 }, () => `<b style="height:${20 + Math.round(r() * 70)}%"></b>`).join("");
  } else {
    el.textContent = c.label;
  }
  $(`[data-lane="${c.lane}"]`).append(el);
  return el;
});

const stepsBox = $("[data-process-copy]");
stepsBox.innerHTML = PROCESS.map((p, i) => `<div class="step"><h3><span class="tc">${pad(i + 1)}</span>${p.title}</h3><p>${p.body}</p></div>`).join("");
const steps = $$(".step", stepsBox);
const STEP_OUT = { clipPath: "inset(0% 0% 100% 0%)", y: 24 };
let activeStep = 0;
function setStep(i: number) {
  if (i === activeStep) return;
  const prev = steps[activeStep];
  activeStep = i;
  const d = reduced ? 0 : 1;
  gsap.to(prev, { clipPath: "inset(0% 0% 100% 0%)", y: -24, duration: 0.45 * d, ease: "trace", overwrite: true });
  gsap.fromTo(steps[i], STEP_OUT, { clipPath: "inset(0% 0% -10% 0%)", y: 0, duration: 0.8 * d, ease: "trace", delay: 0.15 * d, overwrite: true });
}
const playhead = $("[data-playhead]");
const processTc = $("[data-process-tc]");
const lane = $(".tl__lane");
function updateTimeline(p: number) {
  gsap.set(playhead, { x: p * lane.clientWidth });
  processTc.textContent = timecode(p * TL_SECONDS);
  clipEls.forEach((el, i) => el.classList.toggle("is-on", p >= clips[i].from && p <= clips[i].to));
  let idx = 0;
  PROCESS.forEach((s, i) => { if (p >= s.at) idx = i; });
  setStep(idx);
}

/* ---------------- Statement words ---------------- */

const statement = $("[data-scrub-words]");
(function splitWords(node: Node) {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType !== Node.TEXT_NODE) return splitWords(child);
    const frag = document.createDocumentFragment();
    (child.textContent ?? "").split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) return frag.append(part);
      const s = document.createElement("span");
      s.className = "w";
      s.textContent = part;
      frag.append(s);
    });
    child.replaceWith(frag);
  });
})(statement);

/* ---------------- Reel ---------------- */

const reelMedia = $("[data-reel-media]");
const reelEmbed = parseVideo(SITE.reel, true);
if (reelEmbed.kind === "file") reelMedia.innerHTML = `<video src="${reelEmbed.src}" muted loop playsinline autoplay preload="metadata"></video>`;
else $(".reel").classList.add("is-loop");
const reelFrame = $(".reel__frame");
const windowInset = () => {
  const vw = reelFrame.clientWidth, vh = reelFrame.clientHeight;
  const w = Math.min(vw * (vw < 760 ? 0.9 : 0.62), 1080);
  const h = (w * 9) / 16;
  const y = Math.max(0, (vh - h) / 2), x = (vw - w) / 2;
  return `inset(${y}px ${x}px ${y}px ${x}px round 32px)`;
};

/* ================================================================ */
/* Smooth scroll                                                    */
/* ================================================================ */

history.scrollRestoration = "manual";
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4) });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
function scrollToY(target: number | HTMLElement, immediate = false) {
  const offset = typeof target === "number" ? 0 : -navH() - 24;
  if (lenis) lenis.scrollTo(target, { immediate, duration: 1.3, offset, force: true });
  else if (typeof target === "number") window.scrollTo(0, target);
  else window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY + offset);
}

/* ================================================================ */
/* Per-page behaviour. Each page builds its scroll effects on enter */
/* and tears them down on leave, so pinned sections always measure  */
/* against the page that is actually showing.                       */
/* ================================================================ */

const nav = $(".nav");
let pageCtx: gsap.Context | null = null;
let pageMM: gsap.MatchMedia | null = null;
let riseIO: IntersectionObserver | null = null;

function setupRise(view: HTMLElement) {
  riseIO?.disconnect();
  if (reduced || !("IntersectionObserver" in window)) return;
  const els = [...$$("[data-reveal]", view), ...$$("[data-reveal]", $("#contact"))];
  els.forEach((el) => el.classList.remove("below"));
  const below = els.filter((el) => el.getBoundingClientRect().top > window.innerHeight);
  below.forEach((el) => el.classList.add("below"));
  riseIO = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.remove("below"); riseIO?.unobserve(en.target); }
    }),
    { rootMargin: "0px 0px -8% 0px" },
  );
  below.forEach((el) => riseIO!.observe(el));
}

const ENTER: Record<Route, () => void> = {
  home() {
    const heroMark = $("[data-draw='hero']");
    playMark(heroMark);

    if (reelEmbed.kind !== "file") {
      const loopMark = $("[data-draw='loop']");
      const loopTc = $("[data-loop-tc]");
      // The mark draws on once per visit, then holds still. Playing only once stops phones from
      // restarting it mid-draw when the address bar resizes the viewport while scrolling.
      const play = () => { playMark(loopMark); runTimecode(loopTc); };
      if (!reduced) loopMark.classList.add("pre");
      ScrollTrigger.create({ trigger: ".reel", start: "top 40%", once: true, onEnter: play });
    }

    if (reduced) {
      gsap.set(reelFrame, { clipPath: windowInset() });
      return;
    }
    gsap.timeline({ scrollTrigger: { trigger: ".reel", start: "top top", end: "+=140%", pin: true, scrub: 0.6, invalidateOnRefresh: true } })
      .fromTo(reelFrame, { clipPath: windowInset }, { clipPath: "inset(0px 0px 0px 0px round 0px)", ease: "trace", duration: 1 })
      .to(".reel__cap--l", { x: () => -window.innerWidth * 0.2, ease: "trace", duration: 0.6 }, 0)
      .to(".reel__cap--r", { x: () => window.innerWidth * 0.2, ease: "trace", duration: 0.6 }, 0)
      .to({}, { duration: 0.4 }); // then stillness

    gsap.fromTo($$(".w", statement), { color: "#dcdcd7" }, {
      color: (_i: number, el: Element) => (el.closest("em") ? "#ff4f1f" : "#101012"),
      ease: "none",
      stagger: 0.1,
      scrollTrigger: { trigger: statement, start: "top 80%", end: "bottom 50%", scrub: true },
    });
  },

  work() {},

  services() {
    if (!reduced) {
      gsap.set($$(".vis-clips span", track), { scaleX: 0 });
      gsap.set($$(".vis-phone span", track), { clipPath: "inset(100% 0% 0% 0% round 12px)" });
      gsap.set($$(".vis-wave i", track), { scaleY: 0 });
      $$(".vis-player__wm", track).forEach((el) => el.classList.add("pre"));
    }
    pageMM = gsap.matchMedia();
    pageMM.add({ desktop: "(min-width: 761px)", mobile: "(max-width: 760px)" }, (ctx) => {
      const { desktop } = ctx.conditions as { desktop: boolean };
      if (reduced) return;
      if (desktop) {
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const tween = gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: ".services", start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true,
            onUpdate: (s) => gsap.set("[data-services-progress]", { scaleX: s.progress }),
          },
        });
        svcs.forEach((svc) => ScrollTrigger.create({ trigger: svc, containerAnimation: tween, start: "left 85%", once: true, onEnter: () => animateServiceVisual(svc) }));
      } else {
        svcs.forEach((svc) => ScrollTrigger.create({ trigger: svc, start: "top 80%", once: true, onEnter: () => animateServiceVisual(svc) }));
      }
    });
  },

  process() {
    activeStep = 0;
    gsap.set(steps[0], { clipPath: "inset(0% 0% -10% 0%)", y: 0 });
    gsap.set(steps.slice(1), STEP_OUT);
    ScrollTrigger.create({
      trigger: ".process", start: "top top", end: "+=260%", pin: true, scrub: true,
      onUpdate: (s) => updateTimeline(s.progress * 0.999),
      onRefresh: (s) => updateTimeline(s.progress * 0.999),
    });
  },

  about() {},
};

function enterPage(route: Route) {
  const view = $(`[data-view="${route}"]`);
  nav.dataset.theme = ROUTES[route].theme;
  $$("[data-route-link]").forEach((a) => a.classList.toggle("is-active", a.dataset.routeLink === route));
  document.title = route === "home" ? "Reyimation · Video editing & motion graphics" : `${ROUTES[route].title} · Reyimation`;

  pageCtx = gsap.context(() => {
    ENTER[route]();

    // The nav takes the colour of whatever section sits under it.
    [...$$("[data-nav]", view), $("#contact"), $(".foot")].forEach((section) => {
      const parent = section.parentElement!;
      ScrollTrigger.create({
        trigger: parent.classList.contains("pin-spacer") ? parent : section,
        start: () => `top ${navH() / 2}px`,
        end: () => `bottom ${navH() / 2}px`,
        onToggle: (s) => { if (s.isActive) nav.dataset.theme = section.dataset.nav!; },
      });
    });

    // Footer end card draws on each time it comes into view, like the kit's player.
    const footMark = $("[data-draw='footer']");
    if (!reduced) footMark.classList.add("pre");
    ScrollTrigger.create({ trigger: footMark, start: "top 85%", once: true, onEnter: () => playMark(footMark) });
  });

  ScrollTrigger.refresh();
  setupRise(view);
}

function leavePage() {
  pageMM?.revert();
  pageMM = null;
  pageCtx?.revert();
  pageCtx = null;
}

/* ================================================================ */
/* Page transitions: one per destination, all in the kit's language */
/* ================================================================ */

type Transition = { build: (t: HTMLElement, r: Route) => string; cover: (t: HTMLElement) => gsap.core.Timeline; reveal: (t: HTMLElement) => gsap.core.Timeline };

const titleBlock = (r: Route) => `<div class="transit__center"><p class="transit__title">${ROUTES[r].title}.</p></div>`;
const TITLE_IN = { clipPath: "inset(0% 0% 100% 0%)", y: 40 };
const TITLE_SHOWN = { clipPath: "inset(0% 0% -20% 0%)", y: 0 };

const TRANSITIONS: Record<Route, Transition> = {
  // Home: Night wipes up, the wordmark traces itself on (the kit's signature), then the curtain lifts.
  home: {
    build: () => `<div class="transit__panel"></div><div class="transit__center"><div class="transit__mark pre">${wordmark()}</div></div>`,
    cover: (t) => {
      const tl = gsap.timeline();
      tl.fromTo($(".transit__panel", t), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.55, ease: "trace" })
        .call(() => draw($(".transit__mark", t), 1.5), [], 0.3)
        .to({}, { duration: drawDuration(1.5) - 0.2 });
      return tl;
    },
    reveal: (t) => gsap.timeline().to([$(".transit__panel", t), $(".transit__center", t)], { clipPath: "inset(0% 0% 100% 0%)", duration: 0.6, ease: "trace" }),
  },

  // Work: a splice. Two Ink halves close like a shutter, a single Signal cut line flashes across, they part.
  work: {
    build: (_t, r) => `<div class="transit__half transit__half--top"></div><div class="transit__half transit__half--bottom"></div><div class="transit__cut"></div>${titleBlock(r)}`,
    cover: (t) => {
      const tl = gsap.timeline();
      tl.fromTo($(".transit__half--top", t), { yPercent: -100 }, { yPercent: 0, duration: 0.5, ease: "trace" }, 0)
        .fromTo($(".transit__half--bottom", t), { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: "trace" }, 0)
        .fromTo($(".transit__cut", t), { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: "trace" }, 0.4)
        .fromTo($(".transit__center", t).children, TITLE_IN, { ...TITLE_SHOWN, duration: 0.6, ease: "rise", stagger: 0.06 }, 0.45)
        .to({}, { duration: 0.15 });
      return tl;
    },
    reveal: (t) => {
      const tl = gsap.timeline();
      tl.to($(".transit__cut", t), { scaleX: 0, transformOrigin: "right", duration: 0.3, ease: "trace" }, 0)
        .to($(".transit__center", t), { autoAlpha: 0, duration: 0.2 }, 0)
        .to($(".transit__half--top", t), { yPercent: -100, duration: 0.55, ease: "trace" }, 0.1)
        .to($(".transit__half--bottom", t), { yPercent: 100, duration: 0.55, ease: "trace" }, 0.1);
      return tl;
    },
  },

  // Services: a horizontal sweep, like scrubbing sideways through the services track.
  services: {
    build: (_t, r) => `<div class="transit__panel transit__panel--ink"></div>${titleBlock(r)}`,
    cover: (t) => {
      const tl = gsap.timeline();
      tl.fromTo($(".transit__panel", t), { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "trace" }, 0)
        .fromTo($(".transit__center", t).children, { x: 120, clipPath: "inset(0% 0% 0% 100%)" }, { x: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "rise", stagger: 0.05 }, 0.25)
        .to({}, { duration: 0.15 });
      return tl;
    },
    reveal: (t) => {
      const tl = gsap.timeline();
      tl.to($(".transit__center", t).children, { x: -120, clipPath: "inset(0% 100% 0% 0%)", duration: 0.5, ease: "trace", stagger: 0.04 }, 0)
        .to($(".transit__panel", t), { clipPath: "inset(0% 100% 0% 0%)", duration: 0.6, ease: "trace" }, 0.1);
      return tl;
    },
  },

  // Process: a playhead. The Signal line scrubs across, laying Night down behind it with a running timecode,
  // then scrubs again and lifts it off.
  process: {
    build: (_t, r) => `<div class="transit__panel"></div><span class="transit__tc tc">00:00:00:00</span>${titleBlock(r)}<div class="transit__playhead"></div>`,
    cover: (t) => {
      const panel = $(".transit__panel", t), head = $(".transit__playhead", t), tc = $(".transit__tc", t);
      const p = { v: 0 };
      const tl = gsap.timeline();
      tl.to(p, {
        v: 1, duration: 0.75, ease: "trace",
        onUpdate: () => {
          gsap.set(panel, { clipPath: `inset(0% ${(1 - p.v) * 100}% 0% 0%)` });
          gsap.set(head, { x: p.v * window.innerWidth });
          tc.textContent = timecode(p.v * 2);
        },
      })
        .fromTo($(".transit__center", t).children, TITLE_IN, { ...TITLE_SHOWN, duration: 0.6, ease: "rise", stagger: 0.06 }, 0.45)
        .set(head, { x: 0 })
        .to({}, { duration: 0.1 });
      return tl;
    },
    reveal: (t) => {
      const panel = $(".transit__panel", t), head = $(".transit__playhead", t), center = $(".transit__center", t), tc = $(".transit__tc", t);
      const p = { v: 0 };
      return gsap.timeline().to(p, {
        v: 1, duration: 0.75, ease: "trace",
        onUpdate: () => {
          const clip = `inset(0% 0% 0% ${p.v * 100}%)`;
          gsap.set([panel, center, tc], { clipPath: clip });
          gsap.set(head, { x: p.v * window.innerWidth });
          tc.textContent = timecode(2 + p.v * 1);
        },
      });
    },
  },

  // About: an iris that opens from the play button, the kit's "it's all in the i" detail.
  about: {
    build: (_t, r) => `<div class="transit__panel"></div><div class="transit__center"><span class="transit__play"></span><p class="transit__title">${ROUTES[r].title}.</p></div>`,
    cover: (t) => {
      const tl = gsap.timeline();
      tl.fromTo($(".transit__panel", t), { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", duration: 0.7, ease: "trace" }, 0)
        .fromTo($(".transit__play", t), { scale: 0 }, { scale: 1, duration: 0.55, ease: "pop" }, 0.35)
        .fromTo($$(".transit__center > :not(.transit__play)", t), TITLE_IN, { ...TITLE_SHOWN, duration: 0.6, ease: "rise", stagger: 0.06 }, 0.5)
        .to({}, { duration: 0.15 });
      return tl;
    },
    reveal: (t) => {
      const tl = gsap.timeline();
      tl.to($(".transit__center", t), { scale: 0.92, autoAlpha: 0, duration: 0.3, ease: "trace" }, 0)
        .to($(".transit__panel", t), { clipPath: "circle(0% at 50% 50%)", duration: 0.65, ease: "trace" }, 0.05);
      return tl;
    },
  },
};

/* ================================================================ */
/* Router                                                           */
/* ================================================================ */

const transit = $("[data-transit]");
let current: Route | null = null;
let busy = false;

function parseRoute(): Route {
  const m = location.hash.match(/^#\/(\w+)/);
  const r = (m?.[1] ?? "home") as Route;
  return r in ROUTES ? r : "home";
}

function show(route: Route) {
  if (current) leavePage();
  $$(".view").forEach((v) => (v.hidden = v.dataset.view !== route));
  current = route;
  scrollToY(0, true);
  enterPage(route);
}

async function go(route: Route) {
  if (busy) return;
  if (route === current) { scrollToY(0); return; }
  if (reduced || !current) { show(route); return; }
  busy = true;
  lenis?.stop();
  const t = TRANSITIONS[route];
  transit.innerHTML = t.build(transit, route);
  transit.classList.add("is-on");
  await t.cover(transit);
  show(route);
  lenis?.start();
  await t.reveal(transit);
  transit.classList.remove("is-on");
  transit.innerHTML = "";
  busy = false;
  if (parseRoute() !== current) go(parseRoute()); // a click landed mid-transition
}

document.addEventListener("click", (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a) return;
  const href = a.getAttribute("href")!;
  if (href.startsWith("#/")) {
    e.preventDefault();
    const r = (href.slice(2) || "home") as Route;
    if (r === current) { scrollToY(0); return; }
    history.pushState(null, "", href === "#/" ? location.pathname : href);
    go(r in ROUTES ? r : "home");
    return;
  }
  e.preventDefault();
  if (href === "#top") return scrollToY(0);
  const target = document.querySelector<HTMLElement>(href);
  if (target) scrollToY(target);
});
window.addEventListener("popstate", () => go(parseRoute()));

/* ================================================================ */
/* Video modal                                                      */
/* ================================================================ */

const modal = $("[data-modal]");
const modalMedia = $("[data-modal-media]");
let lastFocus: HTMLElement | null = null;

function openVideo(title: string, meta: string, url: string, empty = ["Cut in progress.", "This one is still in the edit. Check back soon."]) {
  lastFocus = document.activeElement as HTMLElement;
  $("[data-modal-title]").textContent = title;
  $("[data-modal-meta]").textContent = meta;
  const v = parseVideo(url);
  if (v.kind === "iframe") {
    modalMedia.innerHTML = `<iframe src="${v.src}" title="${title}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>`;
  } else if (v.kind === "file") {
    modalMedia.innerHTML = `<video src="${v.src}" controls autoplay playsinline></video>`;
  } else {
    modalMedia.innerHTML = `<div class="modal__empty"><div class="modal__mark${reduced ? "" : " pre"}">${wordmark()}</div><b>${empty[0]}</b><span>${empty[1]}</span></div>`;
    playMark($(".modal__mark", modalMedia));
  }
  modal.hidden = false;
  lenis?.stop();
  document.documentElement.style.overflow = "hidden";
  if (!reduced) {
    gsap.fromTo(".modal__back", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
    gsap.fromTo(".modal__box", { y: 40, clipPath: "inset(50% 0% 50% 0% round 20px)" }, { y: 0, clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 0.9, ease: "trace", clearProps: "clipPath,transform" });
  }
  $<HTMLButtonElement>(".modal__close").focus();
}

function closeVideo() {
  if (modal.hidden) return;
  const done = () => {
    modal.hidden = true;
    modalMedia.innerHTML = "";
    gsap.set([".modal__back", ".modal__box"], { clearProps: "all" });
    lenis?.start();
    document.documentElement.style.overflow = "";
    lastFocus?.focus({ preventScroll: true });
  };
  if (reduced) return done();
  gsap.to(".modal__box", { clipPath: "inset(50% 0% 50% 0% round 20px)", duration: 0.45, ease: "trace" });
  gsap.to(".modal__back", { autoAlpha: 0, duration: 0.45, onComplete: done });
}

$$("[data-close]").forEach((el) => el.addEventListener("click", closeVideo));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeVideo();
  if (e.key === "Tab" && !modal.hidden) {
    const f = $$<HTMLElement>("button, iframe, video, a[href]", modal);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

$$("[data-play-reel]").forEach((b) =>
  b.addEventListener("click", () =>
    openVideo("Showreel 2026", `Reyimation · ${SITE.reelLength}`, SITE.reel, ["The 2026 reel is in the edit.", "Until it lands, the selected work shows the craft."]),
  ),
);

/* ================================================================ */
/* Nav mark, email, boot                                            */
/* ================================================================ */

const navBrand = $(".nav__brand");
let lastNavDraw = 0;
if (!reduced) {
  // The nav mark retraces itself on hover, at most once per draw.
  navBrand.addEventListener("mouseenter", () => {
    if (performance.now() - lastNavDraw < drawDuration() * 1000) return;
    lastNavDraw = performance.now();
    draw(navBrand);
  });
}

const toast = $("[data-toast]");
let toastTimer = 0;
$("[data-copy-email]").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(SITE.email);
    toast.textContent = "Copied";
  } catch {
    toast.textContent = SITE.email;
  }
  toast.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 1400);
});

if (import.meta.env.DEV) Object.assign(window, { ScrollTrigger, lenis, goRoute: go });

// First paint: open whichever page the address points at, then re-measure once Geist is in.
show(parseRoute());
const ready = document.fonts ? document.fonts.ready : Promise.resolve();
ready.then(() => {
  ScrollTrigger.refresh();
  if (current) setupRise($(`[data-view="${current}"]`));
});
window.addEventListener("load", () => ScrollTrigger.refresh());
