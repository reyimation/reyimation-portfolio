import { defineConfig } from "vite";

// Relative base so the build works on GitHub Pages (username.github.io/repo/) and any static host.
export default defineConfig({
  base: "./",
  server: {
    // File events are unreliable in some Windows setups; polling keeps HMR honest.
    watch: { usePolling: true, interval: 250 },
  },
});
