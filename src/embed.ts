// Turns a YouTube, Vimeo or file link into player markup.

export type Embed =
  | { kind: "iframe"; src: string }
  | { kind: "file"; src: string }
  | { kind: "none" };

export function parseVideo(url: string, autoplay = true): Embed {
  const u = url.trim();
  if (!u) return { kind: "none" };

  const yt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  if (yt) {
    const q = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1", autoplay: autoplay ? "1" : "0" });
    return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?${q}` };
  }

  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: "iframe", src: `https://player.vimeo.com/video/${vm[1]}?autoplay=${autoplay ? 1 : 0}&dnt=1` };

  return { kind: "file", src: u };
}

export function isFile(url: string): boolean {
  return parseVideo(url).kind === "file";
}
