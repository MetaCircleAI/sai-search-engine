import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = path.dirname(fileURLToPath(import.meta.url))
const courseRoot = path.resolve(root, '../ai-education-course')
const githubPages = process.env.GITHUB_PAGES === 'true'

function githubPagesSpa() {
  return {
    name: 'github-pages-spa',
    apply: 'build' as const,
    closeBundle() {
      if (!githubPages) return
      const dist = path.join(root, 'dist')
      fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'))
      fs.writeFileSync(path.join(dist, '.nojekyll'), '')
    },
  }
}

export default defineConfig({
  base: githubPages ? '/sai-search-engine/' : '/',
  plugins: [react(), tailwindcss(), githubPagesSpa()],
  resolve: {
    // One React instance for explore + aliased course modules.
    dedupe: ['react', 'react-dom'],
    alias: {
      '@course': path.join(courseRoot, 'src'),
      '@': path.join(root, 'src'),
    },
  },
  // Reuse MNIST / sfx / videos from the source course without copying.
  publicDir: path.join(courseRoot, 'public'),
  server: {
    fs: {
      allow: [root, courseRoot],
    },
  },
  optimizeDeps: {
    include: ['framer-motion', 'katex', 'lucide-react', 'fuse.js'],
  },
})
