# Reyimation · Portfolio

Portfolio site for **Reyimation**, video editing and motion graphics. *Light, in motion.*

Built on the Identity 2026 brand kit: Ink, Paper and one Signal orange, Geist type, and the line-drawn wordmark that traces itself on.

## What's on the page

| Chapter | What it does |
| --- | --- |
| Hero | The wordmark draws itself letter by letter, then the play button lands. Live timecode runs in the corner. |
| Showreel | A 16:9 window opens to full-bleed as you scroll. Click to play. |
| Statement | The approach, lit word by word as you read. |
| Selected work | Filterable grid (Editing / Motion / Short-form) with hover previews and a video player. |
| Services | Horizontal pinned track with small animated visuals. |
| Process | An edit timeline. Scrolling moves the playhead across the clips. |
| Toolkit, About, Contact | Tools, a short bio, and a one-click email. |

## Add your work

Everything you edit is in **`src/content.ts`**:

- `SITE.reel` — your showreel. A YouTube or Vimeo link, or an `.mp4` (put the file in `public/` and write `"reel.mp4"`).
- `WORKS` — your projects. For each one set `title`, `client`, `category`, `year`, `duration`, `summary` and `video` (YouTube, Vimeo or `.mp4`).
  - Optional `poster`: an image in `public/`, for example `"work/brand-film.jpg"`.
  - Optional `preview`: a short muted `.mp4` that plays on hover.
  - The first project gets the big tile.
- `SITE.socials` — fill in the links you want shown. Empty ones are hidden.
- `SITE.cv` — put `cv.pdf` in `public/` and set `cv: "cv.pdf"` to show a Download CV button.

Keep large videos on YouTube or Vimeo. GitHub rejects files over 100 MB.

## Run it locally

```bash
npm install
npm run dev
```

## Deploy

Every push to `main` builds and publishes to GitHub Pages through `.github/workflows/deploy.yml`.
One-time setup: in the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.

The site will be live at `https://<your-username>.github.io/reyimation-portfolio/`.

## Stack

Vite, TypeScript, GSAP (ScrollTrigger, Flip, CustomEase) and Lenis smooth scroll. No framework, about 70 KB of JavaScript gzipped. Respects `prefers-reduced-motion`.
