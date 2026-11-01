# MetaCircle Explore

**Knowledge you can experiment with.**

A search-first interface over the existing [ai-education-course](../ai-education-course) content. Lessons become searchable Knowledge Units; the original course sections remain available as Learning Paths.

## Run

```bash
npm install
npm run dev
```

Requires the sibling project at `../ai-education-course` (imported via Vite alias `@course`, not copied).

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4 (shared theme from the course)
- Fuse.js local search
- React Router
- Course lessons, experiments, and KaTeX rendering reused in place

## Routes

| Path | Purpose |
|------|---------|
| `/` | Search homepage |
| `/u/:id` | Knowledge Unit (Textbook / Discovery modes) |
| `/paths` | Original course sections as learning paths |
| `/graph` | Lightweight knowledge graph of course sequence |
