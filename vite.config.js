import { defineConfig } from 'vite';
import { sites } from '@openai/sites-vite-plugin';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Hash authoritative source and assets, including uncommitted edits, for refresh identity.
function reviewBuildId() {
  const hash = createHash('sha256');
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) visit(path);
      else { hash.update(path); hash.update(readFileSync(path)); }
    }
  }
  visit('src'); visit('public/assets');
  hash.update(readFileSync('package-lock.json'));
  return `afterlight-${hash.digest('hex').slice(0, 16)}`;
}

export default defineConfig({
  base: process.env.PAGES_BASE || '/',
  plugins: [sites()],
  define: { __AFTERLIGHT_REVIEW_BUILD__: JSON.stringify(reviewBuildId()) },
  build: { rollupOptions: { input: {
    main: resolve('index.html'), review: resolve('spatial-review.html'),
  } } },
});
