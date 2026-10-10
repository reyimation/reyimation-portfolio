// The Reyimation wordmark, drawn from single 14-unit strokes (Identity 2026 kit).
// Each letter is its own path with an index (--i), so it traces on in sequence exactly like the kit.
const LETTERS: [string, number][] = [
  ["M7 93 V70 A23 23 0 0 1 41.50 50.08", 0],
  ["M7 70 H53 A23 23 0 0 0 7 70 A23 23 0 0 0 46.26 86.26", 59],
  ["M7 47 L31.9 93 M53 47 L19 121", 129],
  ["M7 47 V93", 201],
  ["M7 93 V64 A17 17 0 0 1 41 64 V93 M41 64 A17 17 0 0 1 75 64 V93", 229],
  ["M7 70 A23 23 0 1 0 53 70 A23 23 0 1 0 7 70 M53 47 V93", 325],
  ["M18 16 V78 A15 15 0 0 0 33 93 H37 M5 47 H37", 395],
  ["M7 47 V93", 449],
  ["M7 70 A23 23 0 1 0 53 70 A23 23 0 1 0 7 70", 477],
  ["M7 93 V70 A23 23 0 0 1 53 70 V93", 551],
];

export function wordmark(label = "reyimation"): string {
  const paths = LETTERS.map(
    ([d, x], i) => `<path class="ltr" d="${d}" transform="translate(${x} 0)" pathLength="1" style="--i:${i}"/>`,
  ).join("");
  return `<svg class="wm" viewBox="-8 4 627 132" role="img" aria-label="${label}"><g class="strokes" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">${paths}</g><path class="tri" d="M203.0 17.0 L218.0 26.0 L203.0 35.0 Z"/><circle class="dot" cx="456" cy="26" r="8"/></svg>`;
}

/**
 * Plays the kit's draw-on: letters trace in 0.09 s apart, then the play button and the dot pop.
 * Like the kit's player, it restarts by swapping in a fresh copy of the SVG.
 * `speed` > 1 plays it faster (used inside page transitions).
 */
export function draw(container: Element, speed = 1) {
  const svg = container.querySelector("svg.wm");
  if (!svg) return;
  const fresh = svg.cloneNode(true);
  svg.replaceWith(fresh);
  (container as HTMLElement).style.setProperty("--ts", String(speed));
  container.classList.remove("pre");
  container.classList.add("draw");
}

/** Total time the draw-on takes at a given speed, in seconds (dot lands at 1.7 s + 0.45 s). */
export const drawDuration = (speed = 1) => 2.15 / speed;
