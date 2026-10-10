import gsap from "gsap";

// The browser-tab icon plays the kit's motion in miniature: the r traces itself on, the Signal play
// button pops, then it holds still for a few seconds before playing again ("trace, one beat of Signal,
// then stillness"). Each frame is the kit's app-icon SVG written into the <link rel="icon">.

const TRI_C = { x: 66.03, y: 42 }; // centre of the play button, so it pops in place

function iconSVG(offset: number, scale: number): string {
  const s = Math.max(0, scale);
  const tri = `<path d="M59.8 30.8 L78.5 42 L59.8 53.2 Z" fill="#FF4F1F" transform="translate(${TRI_C.x} ${TRI_C.y}) scale(${s.toFixed(3)}) translate(${-TRI_C.x} ${-TRI_C.y})"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22.5" fill="#101012"/><g transform="translate(22 6) scale(.62)"><path d="M7 93 V70 A23 23 0 0 1 41.50 50.08" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${offset.toFixed(3)}" fill="none" stroke="#FAFAF7" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></g>${s > 0.001 ? tri : ""}</svg>`;
}

export function startFavicon() {
  const link = document.querySelector<HTMLLinkElement>("link[data-favicon]");
  if (!link || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const state = { o: 1, s: 0 };
  let last = "";
  const paint = () => {
    const svg = iconSVG(state.o, state.s);
    if (svg === last) return;
    last = svg;
    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  // Kit timing for one letter: trace 1.1 s from 0.25 s, play button pops for 0.55 s, then a long hold.
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 5, onUpdate: paint, onRepeat: paint });
  tl.set(state, { o: 1, s: 0 })
    .to(state, { o: 0, duration: 1.1, ease: "trace" }, 0.25)
    .to(state, { s: 1, duration: 0.55, ease: "pop" }, 1.3);

  // Background tabs pause animation frames; show the finished icon there instead of a half-drawn one.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      tl.pause();
      state.o = 0;
      state.s = 1;
      paint();
    } else {
      tl.restart();
    }
  });
}
