import type { ComponentType } from 'react'
import { LESSON_COMPONENTS } from '@course/lessonRegistry'
import type { LessonProps } from '@course/lessons/lessonTypes'
import type { CourseLessonId, LessonId, SectionId } from '@course/types'
import {
  LESSON_META,
  LESSON_ORDER,
  SECTION_META,
  sectionOfLesson,
} from '@course/types'

export type LearningMode = 'textbook' | 'discovery'

export type KnowledgeUnit = {
  id: CourseLessonId
  title: string
  description: string
  keywords: string[]
  category: string
  categoryBlurb: string
  sectionId: SectionId
  sourceIndex: string
  sourceLesson: string
  sourceChapter: string
  relatedIds: CourseLessonId[]
  component: ComponentType<LessonProps>
  pathIndex: number
}

const FEATURED_IDS: CourseLessonId[] = [
  'gd1d',
  'grokking',
  'attention',
  'vae',
  'dead',
  'spectralbias',
  'residual',
  'doubledescent',
]

const SUGGESTED_QUERIES = [
  'gradient descent',
  'attention',
  'grokking',
  'dead neurons',
  'VAE',
  'double descent',
  'residual',
  'spectral bias',
  'neural collapse',
  'Adam',
]

/** Homepage chips. Labels are display text; ids must exist in the registry. */
const SUGGESTED_CONCEPTS: { id: CourseLessonId; label: string }[] = [
  { id: 'gd1d', label: 'Gradient Descent' },
  { id: 'transformer', label: 'Attention' },
  { id: 'grokking', label: 'Grokking' },
  { id: 'doubledescent', label: 'Double Descent' },
]

const STOP = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are',
  'with', 'from', 'into', 'that', 'this', 'what', 'how', 'why', 'can', 'not',
  'as', 'be', 'by', 'it', 'its', 'you', 'your', 'then', 'than', 'vs',
])

function keywordsFor(id: CourseLessonId, title: string, subtitle: string, category: string): string[] {
  const tokens = `${id} ${title} ${subtitle} ${category}`
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/i)
    .filter((t) => t.length > 1 && !STOP.has(t))
  return [...new Set([id, ...tokens, category.toLowerCase()])]
}

function relatedFor(id: CourseLessonId, sectionId: SectionId): CourseLessonId[] {
  const lessons = SECTION_META[sectionId].lessons.filter(
    (l): l is CourseLessonId => l !== 'challenge' && l in LESSON_COMPONENTS,
  )
  const i = lessons.indexOf(id)
  const nearby: CourseLessonId[] = []
  if (i > 0) nearby.push(lessons[i - 1])
  if (i >= 0 && i < lessons.length - 1) nearby.push(lessons[i + 1])
  // Same-topic extras without inventing scientific edges.
  for (const other of lessons) {
    if (other === id || nearby.includes(other)) continue
    if (nearby.length >= 4) break
    nearby.push(other)
  }
  return nearby
}

function buildRegistry(): KnowledgeUnit[] {
  const units: KnowledgeUnit[] = []
  let pathIndex = 0

  for (const id of LESSON_ORDER) {
    if (id === 'challenge') continue
    const courseId = id as CourseLessonId
    const component = LESSON_COMPONENTS[courseId]
    if (!component) continue

    const meta = LESSON_META[id]
    const sectionId = sectionOfLesson(id)
    if (sectionId == null) continue
    const section = SECTION_META[sectionId]
    const category = section.subtitle

    units.push({
      id: courseId,
      title: meta.title,
      description: meta.subtitle,
      keywords: keywordsFor(courseId, meta.title, meta.subtitle, category),
      category,
      categoryBlurb: section.blurb,
      sectionId,
      sourceIndex: meta.index,
      sourceLesson: meta.title,
      sourceChapter: `${section.title} · ${section.subtitle}`,
      relatedIds: [],
      component,
      pathIndex: pathIndex++,
    })
  }

  for (const unit of units) {
    unit.relatedIds = relatedFor(unit.id, unit.sectionId)
  }

  return units
}

export const KNOWLEDGE_UNITS: KnowledgeUnit[] = buildRegistry()

export const KNOWLEDGE_BY_ID: Record<string, KnowledgeUnit> = Object.fromEntries(
  KNOWLEDGE_UNITS.map((u) => [u.id, u]),
)

export function getUnit(id: string): KnowledgeUnit | undefined {
  return KNOWLEDGE_BY_ID[id]
}

export function featuredUnits(): KnowledgeUnit[] {
  return FEATURED_IDS.map((id) => KNOWLEDGE_BY_ID[id]).filter(Boolean)
}

export function suggestedQueries(): string[] {
  return SUGGESTED_QUERIES
}

export function suggestedConcepts(): { id: CourseLessonId; label: string }[] {
  return SUGGESTED_CONCEPTS.filter((item) => KNOWLEDGE_BY_ID[item.id])
}

export function learningPaths() {
  return ([1, 2, 3, 4, 5, 6] as SectionId[]).map((sectionId) => {
    const meta = SECTION_META[sectionId]
    const units = meta.lessons
      .filter((id): id is CourseLessonId => id !== 'challenge')
      .map((id) => KNOWLEDGE_BY_ID[id])
      .filter(Boolean)
    return {
      id: sectionId,
      title: meta.title,
      subtitle: meta.subtitle,
      blurb: meta.blurb,
      units,
    }
  })
}

export function graphEdges(): { source: string; target: string; kind: 'sequence' | 'topic' }[] {
  const edges: { source: string; target: string; kind: 'sequence' | 'topic' }[] = []
  const seen = new Set<string>()

  for (const path of learningPaths()) {
    for (let i = 0; i < path.units.length - 1; i++) {
      const a = path.units[i].id
      const b = path.units[i + 1].id
      const key = `${a}->${b}`
      if (seen.has(key)) continue
      seen.add(key)
      edges.push({ source: a, target: b, kind: 'sequence' })
    }
  }

  return edges
}

/** Screen order for a learning mode (core screens only). */
export function modeScreenOrder(mode: LearningMode): Array<'knowledge' | 'experiment' | 'quiz'> {
  if (mode === 'discovery') return ['experiment', 'knowledge', 'quiz']
  return ['knowledge', 'experiment', 'quiz']
}

export function nextInPath(id: LessonId): CourseLessonId | null {
  const unit = KNOWLEDGE_BY_ID[id]
  if (!unit) return null
  const path = learningPaths().find((p) => p.id === unit.sectionId)
  if (!path) return null
  const i = path.units.findIndex((u) => u.id === id)
  if (i < 0 || i >= path.units.length - 1) return null
  return path.units[i + 1].id
}

export function prevInPath(id: LessonId): CourseLessonId | null {
  const unit = KNOWLEDGE_BY_ID[id]
  if (!unit) return null
  const path = learningPaths().find((p) => p.id === unit.sectionId)
  if (!path) return null
  const i = path.units.findIndex((u) => u.id === id)
  if (i <= 0) return null
  return path.units[i - 1].id
}
