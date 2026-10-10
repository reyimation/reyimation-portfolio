// The Reyimation wordmark, drawn from single 14-unit strokes (Identity 2026 kit).
// Each letter is its own path so it can trace on in sequence.
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
    ([d, x]) => `<path class="ltr" d="${d}" transform="translate(${x} 0)" pathLength="1"/>`,
  ).join("");
  return `<svg class="wm" viewBox="-8 4 627 132" role="img" aria-label="${label}"><g fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">${paths}</g><path class="tri" d="M203 17 L218 26 L203 35 Z"/><circle class="dot" cx="456" cy="26" r="8"/></svg>`;
}
