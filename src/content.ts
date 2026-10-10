/**
 * Everything you will want to edit lives in this file: copy, links, projects.
 * Change it, save, and the site updates. No other file needs touching to add work.
 */

export const SITE = {
  name: "Reyimation",
  role: "Video editor & motion designer",
  email: "reyimation@gmail.com",
  location: "India, working worldwide",

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
  { title: "Brand film in 60 seconds", client: "Client name", category: "Editing", year: 2026, duration: "01:00", summary: "Interviews, b-roll and a sound bed cut down to a single idea.", video: "" },
  { title: "Logo reveal", client: "Client name", category: "Motion", year: 2026, duration: "00:08", summary: "A line-drawn mark that traces itself on, then lands.", video: "" },
  { title: "YouTube long-form", client: "Client name", category: "Editing", year: 2026, duration: "12:48", summary: "Retention-first edit with pattern interrupts, captions and sound design.", video: "" },
  { title: "Reels pack", client: "Client name", category: "Short-form", year: 2026, duration: "00:30", summary: "Five vertical edits built around the first three seconds.", video: "" },
  { title: "Product explainer", client: "Client name", category: "Motion", year: 2026, duration: "01:30", summary: "Kinetic type and UI animation that explain a product in ninety seconds.", video: "" },
  { title: "Music video", client: "Client name", category: "Editing", year: 2025, duration: "03:12", summary: "Rhythm-cut performance edit with a graded, filmic look.", video: "" },
];

export const SERVICES = [
  {
    code: "01",
    title: "Video editing",
    body: "YouTube videos, ads, brand films and documentaries, cut for story, pacing and retention.",
    tags: ["Premiere Pro", "Story", "Pacing", "Retention"],
    visual: "clips",
  },
  {
    code: "02",
    title: "Motion graphics",
    body: "Titles, explainers, logo animation and kinetic type that keep the eye moving.",
    tags: ["After Effects", "Kinetic type", "Logo animation", "Explainers"],
    visual: "player",
  },
  {
    code: "03",
    title: "Short-form",
    body: "Reels and Shorts with hooks, captions and punch-ins built for the first three seconds.",
    tags: ["Reels", "Shorts", "Captions", "Hooks"],
    visual: "phone",
  },
  {
    code: "04",
    title: "Colour & sound",
    body: "A consistent grade and a clean mix, so the finished piece looks and sounds expensive.",
    tags: ["Colour grading", "Sound design", "Mixing", "Delivery"],
    visual: "wave",
  },
] as const;

/** The process timeline. `at` is where each clip starts on the timeline, 0 to 1. */
export const PROCESS = [
  { title: "Brief", body: "You send footage, references and goals. I reply with a plan and a quote within 24 hours.", at: 0 },
  { title: "First cut", body: "A complete draft with music, pacing and graphics roughed in, so you can see the whole story.", at: 0.25 },
  { title: "Revisions", body: "Two rounds of revisions are included in every project. Notes are timestamped, nothing gets lost.", at: 0.5 },
  { title: "Delivery", body: "4K ProRes and H.264, plus vertical cuts and captions if you need them. On time.", at: 0.75 },
];

export const TOOLS = [
  { name: "Premiere Pro", use: "Edit", body: "Story, pacing, sound and delivery. Every cut starts here." },
  { name: "After Effects", use: "Motion", body: "Titles, logo animation, kinetic type and explainers." },
];
