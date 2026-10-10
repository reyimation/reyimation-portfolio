import "./styles.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { CustomEase } from "gsap/CustomEase";
import Lenis from "lenis";
import { SITE, WORKS, SERVICES, PROCESS, TOOLS, type Work, type Category } from "./content";
import { wordmark } from "./wordmark";
import { parseVideo } from "./embed";

gsap.registerPlugin(ScrollTrigger, Flip, CustomEase);

// Kit motion curves. Trace: letters drawing on. Pop: the play button landing, ~6% overshoot.
CustomEase.create("trace", "0.6, 0, 0.2, 1");
CustomEase.create("pop", "0.3, 1.6, 0.5, 1");

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll(sel)) as T[];

const NAV_H = 52;
const FPS = 25;
const pad = (n: number) => String(n).padStart(2, "0");
function timecode(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds * FPS));
  const s = Math.floor(total / FPS);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(total % FPS)}`;
}

/* ---------------------------------------------------------------- */
/* Static content                                                   */
/* ---------------------------------------------------------------- */

$$("[data-wordmark]").forEach((el) => (el.innerHTML = wordmark()));
$$("[data-email]").forEach((el) => (el.textContent = SITE.email));
$("[data-location]").textContent = SITE.location;
$("[data-year]").textContent = String(new Date().getFullYear());
$("[data-reel-length]").textContent = SITE.reelLength;
$<HTMLAnchorElement>("[data-mailto]").href = `mailto:${SITE.email}?subject=${encodeURIComponent("New project for Reyimation")}`;

const cv = $<HTMLAnchorElement>("[data-cv]");
if (SITE.cv) {
  Object.assign(cv, { href: SITE.cv, target: "_blank", rel: "noopener", hidden: false });
}

const socials = SITE.socials.filter((s) => s.url);
const socialList = $("[data-socials]");
if (socials.length) {
  socialList.innerHTML = socials.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join("");
} else {
  socialList.remove();
}

$("[data-tools]").innerHTML = TOOLS.map((t) => `<li data-reveal><b>${t.name}</b><span class="label">${t.use}</span></li>`).join("");

/* ---------------------------------------------------------------- */
/* Smooth scroll                                                    */
/* ---------------------------------------------------------------- */

// Start at the top so the intro plays and pinned sections measure cleanly.
if (!location.hash) {
  history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
}

let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4) });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

document.addEventListener("click", (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute("href")!;
  const target = id === "#top" ? 0 : document.querySelector<HTMLElement>(id);
  if (target === null) return;
  e.preventDefault();
  // Pinned chapters sit at the very top; everything else clears the fixed nav.
  const pinned = target !== 0 && target.parentElement?.classList.contains("pin-spacer");
  if (lenis) lenis.scrollTo(target, { duration: 1.4, offset: pinned ? 0 : -NAV_H - 32 });
  else if (target === 0) window.scrollTo(0, 0);
  else target.scrollIntoView();
});

/* ---------------------------------------------------------------- */
/* Wordmark draw-on (kit timing, under two seconds)                 */
/* ---------------------------------------------------------------- */

// Letter i starts at 0.25 s + i × 0.09 s and traces for 1.1 s; the play button pops at 1.55 s, the dot at 1.7 s.
function drawTimeline(root: Element, delay = 0) {
  const tl = gsap.timeline({ delay });
  tl.fromTo($$("path.ltr", root), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: "trace", stagger: 0.09 }, 0.25)
    .fromTo($(".tri", root), { scale: 0, transformOrigin: "50% 50%", visibility: "visible" }, { scale: 1, duration: 0.55, ease: "pop", immediateRender: true }, 1.55)
    .fromTo($(".dot", root), { scale: 0, transformOrigin: "50% 50%", visibility: "visible" }, { scale: 1, duration: 0.45, ease: "pop", immediateRender: true }, 1.7);
  return tl;
}

function showDrawn(root: Element) {
  gsap.set($$("path.ltr", root), { strokeDashoffset: 0 });
  gsap.set([$(".tri", root), $(".dot", root)], { scale: 1, visibility: "visible" });
}

// Kit player timecode: counts from 00:00:00:00 and holds at 00:00:03:00 (75 frames).
function runTimecode(el: HTMLElement) {
  const t0 = performance.now();
  const tick = () => {
    const f = Math.min(75, Math.floor((performance.now() - t0) / 40));
    el.textContent = `00:00:${pad(Math.floor(f / FPS))}:${pad(f % FPS)}`;
    if (f < 75) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------------------------------------------------------------- */
/* Hero                                                             */
/* ---------------------------------------------------------------- */

const heroMark = $("[data-draw='hero']");
const liveTc = $("[data-live-tc]");
if (reduced) {
  showDrawn(heroMark);
  liveTc.textContent = "00:00:03:00";
} else {
  drawTimeline(heroMark);
  runTimecode(liveTc);
}

/* ---------------------------------------------------------------- */
/* Rise: kit behaviour. Content below the first screen sits 40px    */
/* lower and rises into place when it enters. Always fully visible. */
/* ---------------------------------------------------------------- */

function setupRise(root: ParentNode = document) {
  if (reduced || !("IntersectionObserver" in window)) return;
  const els = $$("[data-reveal]", root).filter((el) => el.getBoundingClientRect().top > window.innerHeight);
  els.forEach((el) => el.classList.add("below"));
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.remove("below");
        io.unobserve(en.target);
      }
    }),
    { rootMargin: "0px 0px -8% 0px" },
  );
  els.forEach((el) => io.observe(el));
}

/* ---------------------------------------------------------------- */
/* Video modal                                                      */
/* ---------------------------------------------------------------- */

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
    modalMedia.innerHTML = `<div class="modal__empty" data-draw>${wordmark()}<b>${empty[0]}</b><span>${empty[1]}</span></div>`;
    const card = $(".modal__empty", modalMedia);
    if (reduced) showDrawn(card);
    else drawTimeline(card);
  }
  modal.hidden = false;
  lenis?.stop();
  document.documentElement.style.overflow = "hidden";
  if (!reduced) {
    gsap.fromTo(".modal__back", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
    // The player wipes open along its own height (trace, don't fade).
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
    lastFocus?.focus();
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

/* ---------------------------------------------------------------- */
/* Showreel: the kit's motion player opens to full-bleed            */
/* ---------------------------------------------------------------- */

const reelMedia = $("[data-reel-media]");
const reelEmbed = parseVideo(SITE.reel, true);
if (reelEmbed.kind === "file") {
  reelMedia.innerHTML = `<video src="${reelEmbed.src}" muted loop playsinline autoplay preload="metadata"></video>`;
} else {
  $(".reel").classList.add("is-loop");
  const loopMark = $("[data-draw='loop']");
  const loopTc = $("[data-loop-tc]");
  if (reduced) {
    showDrawn(loopMark);
    loopTc.textContent = "00:00:03:00";
  } else {
    // Like the kit player: each time it comes into view, the mark draws on once, then holds still.
    const play = () => { drawTimeline(loopMark); runTimecode(loopTc); };
    ScrollTrigger.create({ trigger: ".reel", start: "top 40%", end: "bottom 60%", onEnter: play, onEnterBack: play });
  }
}

const reelFrame = $(".reel__frame");
const windowInset = () => {
  const vw = reelFrame.clientWidth, vh = reelFrame.clientHeight;
  const w = Math.min(vw * (vw < 760 ? 0.9 : 0.62), 1080);
  const h = (w * 9) / 16;
  const y = Math.max(0, (vh - h) / 2), x = (vw - w) / 2;
  return `inset(${y}px ${x}px ${y}px ${x}px round 32px)`;
};

if (reduced) {
  gsap.set(reelFrame, { clipPath: windowInset() });
} else {
  gsap.timeline({ scrollTrigger: { trigger: ".reel", start: "top top", end: "+=140%", pin: true, scrub: 0.6, invalidateOnRefresh: true } })
    .fromTo(reelFrame, { clipPath: windowInset }, { clipPath: "inset(0px 0px 0px 0px round 0px)", ease: "trace", duration: 1 })
    .to(".reel__cap--l", { x: () => -window.innerWidth * 0.2, ease: "trace", duration: 0.6 }, 0)
    .to(".reel__cap--r", { x: () => window.innerWidth * 0.2, ease: "trace", duration: 0.6 }, 0)
    // Then stillness: hold the full frame before moving on.
    .to({}, { duration: 0.4 });
}

/* ---------------------------------------------------------------- */
/* Statement: words light up as you read                            */
/* ---------------------------------------------------------------- */

const statement = $("[data-scrub-words]");
function splitWords(node: Node) {
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
}
splitWords(statement);
if (!reduced) {
  // Colour moves from the paper line tone to Ink; the final words land in Signal.
  gsap.fromTo(
    $$(".w", statement),
    { color: "#dcdcd7" },
    {
      color: (_i: number, el: Element) => (el.closest("em") ? "#ff4f1f" : "#101012"),
      ease: "none",
      stagger: 0.1,
      scrollTrigger: { trigger: statement, start: "top 80%", end: "bottom 50%", scrub: true },
    },
  );
}

/* ---------------------------------------------------------------- */
/* Work                                                             */
/* ---------------------------------------------------------------- */

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

// Filters: cards slide to their new places; arriving cards wipe in, leaving cards wipe out.
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
    Flip.from(state, {
      duration: reduced ? 0 : 0.8,
      ease: "trace",
      absolute: true,
      nested: true,
      onEnter: (els) => gsap.fromTo(els, { clipPath: "inset(100% 0% 0% 0% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 28px)", duration: 0.8, ease: "trace", clearProps: "clipPath" }),
      onLeave: (els) => gsap.to(els, { clipPath: "inset(0% 0% 100% 0% round 28px)", duration: 0.5, ease: "trace" }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }),
);

/* ---------------------------------------------------------------- */
/* Services: horizontal track pinned on desktop                     */
/* ---------------------------------------------------------------- */

const R_PATH = "M7 93 V70 A23 23 0 0 1 41.50 50.08";
function serviceVisual(kind: string): string {
  if (kind === "clips") {
    const rows = [[3, 5, 2, 4], [6, 3, 4], [2, 4, 3, 5, 2]];
    return `<div class="vis-clips">${rows
      .map((row, ri) => `<div>${row.map((f, ci) => `<span style="flex:${f}"${ri === 1 && ci === 1 ? ' class="hot"' : ""}></span>`).join("")}</div>`)
      .join("")}</div>`;
  }
  if (kind === "trace") {
    // "r, then play": the kit's app icon geometry, drawn as a line.
    return `<div class="vis-trace"><svg viewBox="0 0 100 100" preserveAspectRatio="xMinYMid meet"><g transform="translate(22 6) scale(.62)"><path pathLength="1" d="${R_PATH}"/></g><path class="tri" d="M59.8 30.8 L78.5 42 L59.8 53.2 Z"/></svg></div>`;
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

// Each visual starts undrawn and traces on once its card arrives.
if (!reduced) {
  gsap.set(".vis-clips span", { scaleX: 0 });
  gsap.set(".vis-trace path:not(.tri)", { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(".vis-trace .tri", { scale: 0, transformOrigin: "50% 50%" });
  gsap.set(".vis-phone span", { clipPath: "inset(100% 0% 0% 0% round 12px)" });
  gsap.set(".vis-wave i", { scaleY: 0 });
} else {
  gsap.set(".vis-trace path:not(.tri)", { strokeDasharray: 1, strokeDashoffset: 0 });
}

function animateServiceVisual(svc: HTMLElement) {
  gsap.to($$(".vis-clips span", svc), { scaleX: 1, duration: 1.1, ease: "trace", stagger: 0.06 });
  gsap.to($$(".vis-trace path:not(.tri)", svc), { strokeDashoffset: 0, duration: 1.1, ease: "trace", delay: 0.25 });
  gsap.to($$(".vis-trace .tri", svc), { scale: 1, duration: 0.55, ease: "pop", delay: 1.55 });
  gsap.to($$(".vis-phone span", svc), { clipPath: "inset(0% 0% 0% 0% round 12px)", duration: 1.1, ease: "trace", stagger: 0.09 });
  gsap.to($$(".vis-wave i", svc), { scaleY: 1, duration: 1.1, ease: "trace", stagger: { each: 0.015, from: "center" } });
}

const svcs = $$(".svc", track);
const mm = gsap.matchMedia();
mm.add({ desktop: "(min-width: 761px)", mobile: "(max-width: 760px)" }, (ctx) => {
  if (reduced) return;
  const { desktop } = ctx.conditions as { desktop: boolean };
  if (desktop) {
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: ".services",
        start: "top top",
        end: () => `+=${dist()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (s) => gsap.set("[data-services-progress]", { scaleX: s.progress }),
      },
    });
    svcs.forEach((svc) => ScrollTrigger.create({ trigger: svc, containerAnimation: tween, start: "left 85%", once: true, onEnter: () => animateServiceVisual(svc) }));
  } else {
    svcs.forEach((svc) => ScrollTrigger.create({ trigger: svc, start: "top 80%", once: true, onEnter: () => animateServiceVisual(svc) }));
  }
});

/* ---------------------------------------------------------------- */
/* Process: scroll moves the playhead across an edit timeline       */
/* ---------------------------------------------------------------- */

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

const copy = $("[data-process-copy]");
copy.innerHTML = PROCESS.map((p, i) => `<div class="step"><h3><span class="tc">${pad(i + 1)}</span>${p.title}</h3><p>${p.body}</p></div>`).join("");
const steps = $$(".step", copy);
const STEP_OUT = { clipPath: "inset(0% 0% 100% 0%)", y: 24 };
gsap.set(steps.slice(1), STEP_OUT);

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

ScrollTrigger.create({
  trigger: ".process",
  start: "top top",
  end: "+=260%",
  pin: true,
  scrub: true,
  onUpdate: (s) => updateTimeline(s.progress * 0.999),
  onRefresh: (s) => updateTimeline(s.progress * 0.999),
});

/* ---------------------------------------------------------------- */
/* Footer end card, nav                                             */
/* ---------------------------------------------------------------- */

const footMark = $("[data-draw='footer']");
if (reduced) showDrawn(footMark);
else ScrollTrigger.create({ trigger: footMark, start: "top 85%", once: true, onEnter: () => drawTimeline(footMark) });

const nav = $(".nav");
const navBrand = $(".nav__brand");
let navDraw: gsap.core.Timeline | null = null;
if (!reduced) {
  // The nav mark retraces itself on hover.
  navBrand.addEventListener("mouseenter", () => {
    if (navDraw?.isActive()) return;
    navDraw = drawTimeline(navBrand);
  });
}

const links = $$<HTMLAnchorElement>(".nav__links a");
$$("[data-nav]").forEach((section) => {
  // Pinned sections are measured by their spacer so the pin duration counts.
  const parent = section.parentElement!;
  ScrollTrigger.create({
    trigger: parent.classList.contains("pin-spacer") ? parent : section,
    start: `top ${NAV_H / 2}px`,
    end: `bottom ${NAV_H / 2}px`,
    onToggle: (s) => {
      if (!s.isActive) return;
      nav.dataset.theme = section.dataset.nav!;
      links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${section.id}`));
    },
  });
});

// Copy email.
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

if (import.meta.env.DEV) Object.assign(window, { ScrollTrigger, lenis });

// Measure after Geist loads (line lengths change), then arm the rise on what is below the fold.
const ready = document.fonts ? document.fonts.ready : Promise.resolve();
ready.then(() => {
  ScrollTrigger.refresh();
  setupRise();
});
window.addEventListener("load", () => ScrollTrigger.refresh());
