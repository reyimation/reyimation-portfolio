/**
 * Everything you will want to edit lives in this file: copy, links, projects.
 * Change it, save, and the site updates. No other file needs touching to add work.
 */

export const SITE = {
  name: "Reyimation",
  role: "Video editor & motion designer",
  email: "reyimation@gmail.com",
  location: "India, working worldwide",

  /** Where both "Book a call" buttons go (opens in a new tab). */
  booking: "https://cal.com/reyimation",

  /**
   * Showreel. Paste a YouTube or Vimeo link, or a direct .mp4 URL / file in /public
   * (for example "reel.mp4"). Leave empty to show the animated brand loop instead.
   */
  reel: "",
  reelLength: "01:30",

  /** Optional: a link to your CV PDF (put it in /public, e.g. "cv.pdf"). Empty hides the button. */
  cv: "",

  /** Leave a link empty to hide it. */
  socials: [
    { label: "Instagram", url: "" },
    { label: "YouTube", url: "" },
    { label: "LinkedIn", url: "" },
    { label: "Behance", url: "" },
    { label: "Fiverr", url: "" },
  ],

  /**
   * Icons under the wordmark in the footer. Check these point to your profiles and change any
   * that don't. Add more later in the same shape (the icon key must be one of the three below).
   */
  profiles: [
    { icon: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/reyimation" },
    { icon: "instagram", label: "Instagram", url: "https://www.instagram.com/reyimation" },
    { icon: "youtube", label: "YouTube", url: "https://www.youtube.com/@reyimation" },
  ],
};

export type Category = "Editing" | "Motion" | "Short-form";

export type Work = {
  title: string;
  client: string;
  category: Category;
  year: number;
  /** Shown as a timecode chip, e.g. "01:24". */
  duration: string;
  summary: string;
  /** YouTube, Vimeo or .mp4 link opened in the player. Empty shows "Cut in progress". */
  video: string;
  /** Optional poster image (path in /public or full URL). Without one, a brand poster is drawn. */
  poster?: string;
  /** Optional short muted .mp4 that plays on hover. */
  preview?: string;
};

/**
 * Your portfolio. These are placeholders: replace title, client, summary and video
 * with real projects. Order matters: the first item gets the large tile.
 */
export const WORKS: Work[] = [
  {
    title: "Overnighter",
    client: "Automotive commercial",
    category: "Editing",
    year: 2026,
    duration: "00:52",
    summary: "A widebody GT86 from golden hour to the parking deck, cut to the beat with rolling shots and night light.",
    video: "work/overnighter.mp4",
    poster: "work/overnighter.jpg",
    preview: "work/overnighter-preview.mp4",
  },
  {
    title: "Between Pine & Sea",
    client: "Real estate film",
    category: "Editing",
    year: 2026,
    duration: "01:03",
    summary: "A modern home between the pines and the water, walked through in one breath: architecture, open-plan living and the view.",
    video: "work/between-pine-and-sea.mp4",
    poster: "work/between-pine-and-sea.jpg",
    preview: "work/between-pine-and-sea-preview.mp4",
  },
];

export const SERVICES = [
  {
    code: "01",
    title: "Video editing",
    body: "Commercials, brand films, YouTube and documentaries. Story-first edits with pacing that holds attention to the very last frame.",
    tags: ["Premiere Pro", "Story", "Pacing", "Retention"],
    visual: "clips",
  },
  {
    code: "02",
    title: "Motion graphics",
    body: "Titles, logo reveals, kinetic type and explainers, designed and animated to make a brand move.",
    tags: ["After Effects", "Kinetic type", "Logo animation", "Explainers"],
    visual: "player",
  },
  {
    code: "03",
    title: "Short-form",
    body: "Reels and Shorts engineered for the first three seconds: hooks, captions, punch-ins and loops that stop the scroll.",
    tags: ["Reels", "Shorts", "Captions", "Hooks"],
    visual: "phone",
  },
  {
    code: "04",
    title: "Colour & sound",
    body: "Cinematic grading and a clean, layered mix, so every piece looks and sounds finished.",
    tags: ["Colour grading", "Sound design", "Mixing", "Delivery"],
    visual: "wave",
  },
] as const;

/** The process timeline. `at` is where each clip starts on the timeline, 0 to 1. */
export const PROCESS = [
  { title: "Brief", body: "You share footage, references and goals. Within 24 hours you get a clear plan, timeline and quote.", at: 0 },
  { title: "First cut", body: "A complete first cut with music, pacing and motion in place, so you see the whole story early.", at: 0.25 },
  { title: "Revisions", body: "Two focused rounds of revisions included. Every note timestamped, nothing missed.", at: 0.5 },
  { title: "Delivery", body: "Mastered files in 4K ProRes and H.264, plus vertical cuts and captions. Delivered on time, every time.", at: 0.75 },
];

export const TOOLS = [
  { name: "Premiere Pro", use: "Edit", body: "Where every story takes shape: structure, pacing, sound and finishing." },
  { name: "After Effects", use: "Motion", body: "Where brands come alive: titles, logo reveals, kinetic type and explainers." },
];
