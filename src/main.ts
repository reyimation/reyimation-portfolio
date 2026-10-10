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

// Kit motion: trace ease 0.6, 0, 0.2, 1 and a pop with ~6% overshoot.
CustomEase.create("trace", "0.6, 0, 0.2, 1");
CustomEase.create("pop", "0.3, 1.6, 0.5, 1");

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll(sel)) as T[];

const FPS = 25;
function timecode(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds * FPS));
  const f = total % FPS;
  const s = Math.floor(total / FPS);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(f)}`;
}

/* ---------------------------------------------------------------- */
/* Static content                                                   */
/* ---------------------------------------------------------------- */

$$("[data-wordmark]").forEach((el) => (el.innerHTML = wordmark()));
$$("[data-email]").forEach((el) => (el.textContent = SITE.email));
$("[data-location]").textContent = SITE.location;
$("[data-year]").textContent = String(new Date().getFullYear());
$("[data-reel-length]").textContent = SITE.reelLength;
$<HTMLAnchorElement>("[data-mailto]").href =
  `mailto:${SITE.email}?subject=${encodeURIComponent("New project for Reyimation")}`;

const cv = $<HTMLAnchorElement>("[data-cv]");
if (SITE.cv) {
  cv.href = SITE.cv;
  cv.target = "_blank";
  cv.rel = "noopener";
  cv.hidden = false;
}

const socials = SITE.socials.filter((s) => s.url);
const socialList = $("[data-socials]");
if (socials.length) {
  socialList.innerHTML = socials
    .map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`)
    .join("");
} else {
  socialList.remove();
}

$("[data-tools]").innerHTML = TOOLS.map((t) => `<li><b>${t.name}</b><span>${t.use}</span></li>`).join("");

/* ---------------------------------------------------------------- */
/* Smooth scroll                                                    */
/* ---------------------------------------------------------------- */

// Always start at the top so the intro plays and pinned sections measure cleanly.
if (!location.hash) {
  history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
}

let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
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
  if (lenis) lenis.scrollTo(target, { duration: 1.4, offset: pinned ? 0 : -56 });
  else if (target === 0) window.scrollTo(0, 0);
  else target.scrollIntoView();
});

/* ---------------------------------------------------------------- */
/* Wordmark drawing                                                 */
/* ---------------------------------------------------------------- */

function drawTimeline(root: Element, opts: { delay?: number } = {}) {
  const ltr = $$("path.ltr", root);
  const tri = $(".tri", root);
  const dot = $(".dot", root);
  // Kit timing: letters trace on 0.09 s apart over 1.1 s, the play button pops at 1.3 s, the dot at 1.45 s.
  const tl = gsap.timeline({ delay: opts.delay ?? 0 });
  tl.fromTo(ltr, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: "trace", stagger: 0.09 }, 0)
    .fromTo(tri, { scale: 0, transformOrigin: "50% 50%", visibility: "visible" }, { scale: 1, duration: 0.55, ease: "pop", immediateRender: true }, 1.3)
    .fromTo(dot, { scale: 0, transformOrigin: "50% 50%", visibility: "visible" }, { scale: 1, duration: 0.45, ease: "pop", immediateRender: true }, 1.45);
  return tl;
}

function showDrawn(root: Element) {
  gsap.set($$("path.ltr", root), { strokeDashoffset: 0 });
  gsap.set([$(".tri", root), $(".dot", root)], { scale: 1, visibility: "visible" });
}

/* ---------------------------------------------------------------- */
/* Reveal: wipe up from behind a mask                               */
/* ---------------------------------------------------------------- */

const HIDDEN = { y: 44, clipPath: "inset(-20% -6% 100% -6%)" };
const SHOWN = { y: 0, clipPath: "inset(-20% -6% -20% -6%)" };

function reveal(targets: gsap.TweenTarget, vars: gsap.TweenVars = {}) {
  // fromTo renders HIDDEN inline right away, so the pre-paint CSS mask can step aside.
  const tween = gsap.fromTo(targets, HIDDEN, {
    ...SHOWN,
    duration: 1.1,
    ease: "expo.out",
    stagger: 0.08,
    clearProps: "clipPath,transform",
    ...vars,
  });
  tween.targets<Element>().forEach((el) => el.classList.add("in"));
  return tween;
}

/* ---------------------------------------------------------------- */
/* Hero                                                             */
/* ---------------------------------------------------------------- */

const heroMark = $("[data-draw='hero']");
const heroReveals = $$("[data-reveal]", $(".hero"));
if (reduced) {
  showDrawn(heroMark);
} else {
  gsap.set(heroReveals, HIDDEN);
  reveal(heroReveals[0], { delay: 0.1 });
  drawTimeline(heroMark, { delay: 0.35 });
  reveal(heroReveals.slice(1), { delay: 1.45 });

  // Gentle parallax as the hero leaves.
  gsap.to(".hero__in", {
    yPercent: -18,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
}

const liveTc = $("[data-live-tc]");
const t0 = performance.now();
gsap.ticker.add(() => {
  liveTc.textContent = timecode((performance.now() - t0) / 1000);
});

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
    modalMedia.innerHTML = `<div class="modal__empty"><div style="width:min(320px,60%)">${wordmark()}</div><b>${empty[0]}</b><span>${empty[1]}</span></div>`;
    if (!reduced) drawTimeline(modalMedia, { delay: 0.2 });
  }
  modal.hidden = false;
  lenis?.stop();
  document.documentElement.style.overflow = "hidden";
  if (!reduced) {
    gsap.fromTo(".modal__back", { opacity: 0 }, { opacity: 1, duration: 0.4 });
    gsap.fromTo(".modal__box", { y: 40, scale: 0.96, clipPath: "inset(10% 0 10% 0 round 20px)" }, { y: 0, scale: 1, clipPath: "inset(0% 0 0% 0 round 0px)", duration: 0.8, ease: "expo.out", clearProps: "clipPath" });
  }
  $<HTMLButtonElement>(".modal__close").focus();
}

function closeVideo() {
  if (modal.hidden) return;
  const done = () => {
    modal.hidden = true;
    modalMedia.innerHTML = "";
    lenis?.start();
    document.documentElement.style.overflow = "";
    lastFocus?.focus();
  };
  if (reduced) return done();
  gsap.to(".modal__box", { y: 30, scale: 0.97, duration: 0.3, ease: "power2.in" });
  gsap.to(".modal__back", { opacity: 0, duration: 0.3, onComplete: done });
}

$$("[data-close]").forEach((el) => el.addEventListener("click", closeVideo));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeVideo();
  if (e.key === "Tab" && !modal.hidden) {
    // Keep focus inside the player.
    const f = $$<HTMLElement>("button, iframe, video, a[href]", modal);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

$$("[data-play-reel]").forEach((b) =>
  b.addEventListener("click", () =>
    openVideo("Showreel 2026", `REYIMATION · ${SITE.reelLength}`, SITE.reel, ["The 2026 reel is in the edit.", "Until it lands, the selected work below shows the craft."]),
  ),
);

/* ---------------------------------------------------------------- */
/* Showreel: a 16:9 window opens to full-bleed                      */
/* ---------------------------------------------------------------- */

const reelMedia = $("[data-reel-media]");
const reelEmbed = parseVideo(SITE.reel, true);
if (reelEmbed.kind === "file") {
  reelMedia.innerHTML = `<video src="${reelEmbed.src}" muted loop playsinline autoplay preload="metadata"></video>`;
}

const loopMark = $("[data-draw='loop']");
const loopTc = $("[data-loop-tc]");
if (reelEmbed.kind !== "file") {
  $(".reel").classList.add("is-loop");
  if (reduced) {
    showDrawn(loopMark);
  } else {
    // Trace on, hold, trace off. Loops while the reel is on screen.
    const ltr = $$("path.ltr", loopMark);
    const loop = gsap.timeline({ repeat: -1, paused: true, onUpdate: () => (loopTc.textContent = timecode(loop.totalTime())) });
    loop
      .add(drawTimeline(loopMark))
      .to({}, { duration: 1.4 })
      .to([$(".tri", loopMark), $(".dot", loopMark)], { scale: 0, duration: 0.3, ease: "power2.in" })
      .to(ltr, { strokeDashoffset: -1, duration: 0.8, ease: "trace", stagger: 0.05 }, "<")
      .to({}, { duration: 0.4 });
    ScrollTrigger.create({ trigger: ".reel", start: "top bottom", end: "bottom top", onToggle: (s) => (s.isActive ? loop.play() : loop.pause()) });
  }
}

const reelFrame = $(".reel__frame");
const windowInset = () => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = Math.min(vw * (vw < 760 ? 0.88 : 0.62), 1100);
  const h = (w * 9) / 16;
  return `inset(${(vh - h) / 2}px ${(vw - w) / 2}px ${(vh - h) / 2}px ${(vw - w) / 2}px round 28px)`;
};

if (reduced) {
  gsap.set(reelFrame, { clipPath: windowInset() });
} else {
  gsap.timeline({
    scrollTrigger: { trigger: ".reel", start: "top top", end: "+=140%", pin: true, scrub: 0.6, invalidateOnRefresh: true },
  })
    .fromTo(reelFrame, { clipPath: windowInset }, { clipPath: "inset(0px 0px 0px 0px round 0px)", ease: "power2.inOut", duration: 1 })
    .to(".reel__cap--l", { xPercent: -120, autoAlpha: 0, ease: "power2.in", duration: 0.5 }, 0)
    .to(".reel__cap--r", { xPercent: 120, autoAlpha: 0, ease: "power2.in", duration: 0.5 }, 0)
    .fromTo(".reel__loopmark", { scale: 0.92 }, { scale: 1, ease: "none", duration: 1 }, 0)
    .to({}, { duration: 0.35 });
}

/* ---------------------------------------------------------------- */
/* Statement: words light up as you read                            */
/* ---------------------------------------------------------------- */

const statement = $("[data-scrub-words]");
function splitWords(node: Node) {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      (child.textContent ?? "").split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) frag.append(part);
        else {
          const s = document.createElement("span");
          s.className = "w";
          s.textContent = part;
          frag.append(s);
        }
      });
      child.replaceWith(frag);
    } else {
      splitWords(child);
    }
  });
}
splitWords(statement);
if (!reduced) {
  gsap.fromTo(
    $$(".w", statement),
    { opacity: 0.14 },
    {
      opacity: 1,
      ease: "none",
      stagger: 0.1,
      scrollTrigger: { trigger: statement, start: "top 80%", end: "bottom 45%", scrub: true },
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
  const n = 30;
  const hot = Math.floor(r() * n);
  const bars = Array.from({ length: n }, (_, k) => {
    const h = 18 + Math.round(Math.abs(Math.sin(k * 0.5 + i)) * 60 + r() * 22);
    return `<i style="height:${Math.min(h, 100)}%"${k === hot ? ' class="hot"' : ""}></i>`;
  }).join("");
  const num = String(i + 1).padStart(2, "0");
  return `<div class="poster${i % 2 ? " poster--frame" : ""}"><div class="poster__top"><span>${num} · ${w.category.toUpperCase()}</span></div><p class="poster__title">${w.title}</p><div class="poster__wave">${bars}</div></div>`;
}

const grid = $("[data-works]");
grid.innerHTML = WORKS.map((w, i) => {
  const preview = w.preview ? `<video src="${w.preview}" muted loop playsinline preload="none"></video>` : "";
  return `<div class="card${i === 0 ? " is-lead" : ""}" data-cat="${w.category}" data-i="${i}" tabindex="0" role="button" aria-label="Play ${w.title}">
    <div class="card__media">${poster(w, i)}${preview}<span class="card__dur">${w.duration}</span><span class="card__play" aria-hidden="true"><i></i></span></div>
    <div class="card__body"><div><h3 class="card__title">${w.title}</h3><p class="card__sub">${w.client} · ${w.year}</p></div><span class="card__cat">${w.category}</span></div>
  </div>`;
}).join("");

const cards = $$(".card", grid);
cards.forEach((card) => {
  const w = WORKS[Number(card.dataset.i)];
  const open = () => openVideo(w.title, `${w.client.toUpperCase()} · ${w.year} · ${w.duration}`, w.video);
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
      wave = gsap.to(bars, { scaleY: () => gsap.utils.random(0.35, 1.35), duration: 0.32, ease: "sine.inOut", stagger: { each: 0.012, from: "random" }, repeat: -1, yoyo: true, repeatRefresh: true });
    }
  });
  card.addEventListener("mouseleave", () => {
    if (vid) { card.classList.remove("is-playing"); vid.pause(); }
    wave?.kill();
    if (bars.length) gsap.to(bars, { scaleY: 1, duration: 0.4, ease: "power2.out" });
  });
});

// Filters with a FLIP re-layout.
const cats: ("All" | Category)[] = ["All", ...new Set(WORKS.map((w) => w.category))];
const filters = $("[data-filters]");
filters.innerHTML = cats.map((c, i) => `<button type="button" aria-pressed="${i === 0}">${c}</button>`).join("");
$$<HTMLButtonElement>("button", filters).forEach((btn) =>
  btn.addEventListener("click", () => {
    const cat = btn.textContent as "All" | Category;
    if (btn.getAttribute("aria-pressed") === "true") return;
    $$("button", filters).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    // Finish any pending scroll reveal so Flip measures the real layout.
    gsap.killTweensOf(cards);
    gsap.set(cards, { clearProps: "clipPath,transform,opacity" });
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
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.94, duration: 0.4 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }),
);

/* ---------------------------------------------------------------- */
/* Services: horizontal track pinned on desktop                     */
/* ---------------------------------------------------------------- */

function serviceVisual(kind: string): string {
  if (kind === "clips") {
    const rows = [[3, 5, 2, 4], [6, 3, 4], [2, 4, 3, 5, 2]];
    return `<div class="vis-clips">${rows
      .map((row, ri) => `<div>${row.map((f, ci) => `<span style="flex:${f}"${ri === 1 && ci === 1 ? ' class="hot"' : ""}></span>`).join("")}</div>`)
      .join("")}</div>`;
  }
  if (kind === "trace") {
    return `<div class="vis-trace"><svg viewBox="0 0 220 110" preserveAspectRatio="xMinYMid meet"><path pathLength="1" d="M12 100 V62 A32 32 0 0 1 60 34"/><path pathLength="1" d="M92 60 H150 A29 29 0 0 0 92 60 A29 29 0 0 0 142 82"/><path class="tri" d="M176 30 L204 47 L176 64 Z"/></svg></div>`;
  }
  if (kind === "phone") return `<div class="vis-phone"><span></span><span class="hot"></span><span></span></div>`;
  return `<div class="vis-wave">${Array.from({ length: 44 }, (_, k) => `<i style="height:${20 + Math.round(Math.abs(Math.sin(k * 0.7)) * 70)}%"${k === 27 ? ' class="hot"' : ""}></i>`).join("")}</div>`;
}

const track = $("[data-services]");
track.innerHTML = SERVICES.map(
  (s) => `<article class="svc"><div><span class="svc__code">${s.code} / ${String(SERVICES.length).padStart(2, "0")}</span></div>
    <div class="svc__vis">${serviceVisual(s.visual)}</div>
    <div><h3>${s.title}</h3><p>${s.body}</p><ul class="svc__tags">${s.tags.map((t) => `<li>${t}</li>`).join("")}</ul></div></article>`,
).join("");

function animateServiceVisual(svc: HTMLElement) {
  const clips = $$(".vis-clips span", svc);
  if (clips.length) gsap.fromTo(clips, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "trace", stagger: 0.06 });
  const trace = $$(".vis-trace path:not(.tri)", svc);
  if (trace.length) {
    gsap.fromTo(trace, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: "trace", stagger: 0.15 });
    gsap.fromTo($(".vis-trace .tri", svc), { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.55, ease: "pop", delay: 1 });
  }
  const phones = $$(".vis-phone span", svc);
  if (phones.length) gsap.fromTo(phones, { yPercent: 40, clipPath: "inset(100% 0 0 0 round 12px)" }, { yPercent: 0, clipPath: "inset(0% 0 0 0 round 12px)", duration: 1, ease: "expo.out", stagger: 0.1 });
  const bars = $$(".vis-wave i", svc);
  if (bars.length) gsap.to(bars, { scaleY: () => gsap.utils.random(0.3, 1.2), duration: 0.45, ease: "sine.inOut", stagger: { each: 0.015, from: "center" }, repeat: -1, yoyo: true, repeatRefresh: true });
}

const svcs = $$(".svc", track);
const mm = gsap.matchMedia();
mm.add({ desktop: "(min-width: 761px)", mobile: "(max-width: 760px)" }, (ctx) => {
  const { desktop } = ctx.conditions as { desktop: boolean };
  if (reduced) return;
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
    svcs.forEach((svc) =>
      ScrollTrigger.create({ trigger: svc, containerAnimation: tween, start: "left 85%", once: true, onEnter: () => animateServiceVisual(svc) }),
    );
  } else {
    svcs.forEach((svc) => ScrollTrigger.create({ trigger: svc, start: "top 80%", once: true, onEnter: () => animateServiceVisual(svc) }));
  }
});

/* ---------------------------------------------------------------- */
/* Process: scroll scrubs a playhead across an edit timeline        */
/* ---------------------------------------------------------------- */

const TL_SECONDS = 60;
const ruler = $("[data-ruler]");
ruler.innerHTML = Array.from({ length: TL_SECONDS + 1 }, (_, s) => {
  const left = (s / TL_SECONDS) * 100;
  const major = s % 10 === 0;
  return `<i class="${s % 5 === 0 ? "major" : ""}" style="left:${left}%"></i>${major && s < TL_SECONDS ? `<span style="left:${left}%">00:${String(s).padStart(2, "0")}</span>` : ""}`;
}).join("");

type Clip = { lane: "v1" | "v2" | "a1"; from: number; to: number; label: string; kind?: "gfx" | "audio" };
const clips: Clip[] = [
  ...PROCESS.map((p, i) => ({ lane: "v1" as const, from: p.at + 0.004, to: (PROCESS[i + 1]?.at ?? 1) - 0.004, label: `${String(i + 1).padStart(2, "0")} ${p.title}` })),
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
copy.innerHTML = PROCESS.map(
  (p, i) => `<div class="step"><h3><span>${String(i + 1).padStart(2, "0")}</span>${p.title}</h3><p>${p.body}</p></div>`,
).join("");
const steps = $$(".step", copy);
gsap.set(steps.slice(1), { clipPath: "inset(0 0 100% 0)", y: 24 });

let activeStep = 0;
function setStep(i: number) {
  if (i === activeStep) return;
  const prev = steps[activeStep];
  activeStep = i;
  gsap.to(prev, { clipPath: "inset(0 0 100% 0)", y: -24, duration: reduced ? 0 : 0.5, ease: "power3.in", overwrite: true });
  gsap.fromTo(steps[i], { clipPath: "inset(0 0 100% 0)", y: 24 }, { clipPath: "inset(0 0 -10% 0)", y: 0, duration: reduced ? 0 : 0.8, ease: "expo.out", delay: reduced ? 0 : 0.15, overwrite: true });
}

const playhead = $("[data-playhead]");
const processTc = $("[data-process-tc]");
const laneWidth = () => $(".tl__lane").getBoundingClientRect().width;

function updateTimeline(p: number) {
  gsap.set(playhead, { x: p * laneWidth() });
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
/* Scroll reveals, nav and footer                                   */
/* ---------------------------------------------------------------- */

if (!reduced) {
  const later = $$("[data-reveal]").filter((el) => !el.closest(".hero"));
  gsap.set(later, HIDDEN);
  ScrollTrigger.batch(later, { start: "top 88%", once: true, onEnter: (batch) => reveal(batch) });

  gsap.set(cards, { y: 80, clipPath: "inset(18% 0% 0% 0%)" });
  ScrollTrigger.batch(cards, {
    start: "top 92%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "expo.out", stagger: 0.1, clearProps: "clipPath,transform" }),
  });

  const toolItems = $$(".tools__list li");
  gsap.set(toolItems, HIDDEN);
  ScrollTrigger.batch(toolItems, { start: "top 92%", once: true, onEnter: (batch) => reveal(batch, { stagger: 0.06 }) });

  const footMark = $("[data-draw='footer']");
  ScrollTrigger.create({ trigger: footMark, start: "top 85%", once: true, onEnter: () => drawTimeline(footMark) });
} else {
  showDrawn($("[data-draw='footer']"));
}

// Nav adopts the colour of the section beneath it and marks the active link.
const nav = $(".nav");

// Hovering the nav logo replays its trace, the way the kit's mark arrives everywhere.
const navBrand = $(".nav__brand");
let navDraw: gsap.core.Timeline | null = null;
if (!reduced) {
  navBrand.addEventListener("mouseenter", () => {
    if (navDraw?.isActive()) return;
    navDraw = drawTimeline(navBrand).timeScale(1.6);
  });
}
const links = $$<HTMLAnchorElement>(".nav__links a");
$$("[data-nav]").forEach((section) => {
  // Pinned sections are measured by their spacer so the pin duration counts.
  const parent = section.parentElement!;
  ScrollTrigger.create({
    trigger: parent.classList.contains("pin-spacer") ? parent : section,
    start: "top 28px",
    end: "bottom 28px",
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
    toast.textContent = "Email copied";
  } catch {
    toast.textContent = SITE.email;
  }
  toast.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 2000);
});

if (import.meta.env.DEV) Object.assign(window, { ScrollTrigger, lenis });

// Fonts change line lengths, so measure again once Geist is in.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener("load", () => ScrollTrigger.refresh());
