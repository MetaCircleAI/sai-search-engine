import Fuse from 'fuse.js'
import { KNOWLEDGE_UNITS, type KnowledgeUnit } from './registry'

const fuse = new Fuse(KNOWLEDGE_UNITS, {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'description', weight: 0.25 },
    { name: 'keywords', weight: 0.2 },
    { name: 'category', weight: 0.08 },
    { name: 'sourceChapter', weight: 0.04 },
    { name: 'sourceIndex', weight: 0.03 },
  ],
  threshold: 0.38,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 1,
})

export type SearchHit = {
  unit: KnowledgeUnit
  score: number
}

export function searchUnits(query: string, limit = 24): SearchHit[] {
  const q = query.trim()
  if (!q) return []

  return fuse
    .search(q)
    .slice(0, limit)
    .map((r) => ({
      unit: r.item,
      score: r.score ?? 1,
    }))
}

export function suggestUnits(query: string, limit = 6): KnowledgeUnit[] {
  return searchUnits(query, limit).map((h) => h.unit)
}
