import { formatMinutes } from '../personalize/format'
import type { BackgroundId, Recommendation } from '../personalize/types'
import { describeCourse } from './format'
import type {
  BackgroundLevel,
  CourseSource,
  PersonalizedCourse,
  TimeBudget,
} from './types'

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `course-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function mapBackground(id: BackgroundId): BackgroundLevel {
  if (id === 'beginner') return 'new'
  if (id === 'engineer') return 'some'
  if (id === 'math-physics') return 'comfortable'
  if (id === 'researcher') return 'research'
  return 'some'
}

function mapTime(minutes: number): TimeBudget {
  if (minutes <= 60) return 'short'
  if (minutes <= 180) return 'medium'
  return 'long'
}

function rationaleFor(recommendation: Recommendation): string {
  const engine =
    recommendation.engine === 'llm'
      ? 'Selected by the connected language model from existing knowledge units only.'
      : 'Chosen by a fixed matcher from the knowledge library, not a language model.'
  const extra = [recommendation.engineNote, recommendation.coverageNote].filter(
    (part): part is string => Boolean(part && part.trim()),
  )
  return [engine, ...extra].join(' ')
}

/** Turns an advisor result into a course of registry references. Does not save it. */
export function courseFromRecommendation(
  recommendation: Recommendation,
  source: CourseSource,
): PersonalizedCourse {
  const now = Date.now()
  const unitIds = recommendation.unitIds.filter((id) => typeof id === 'string')
  return {
    id: newId(),
    title: recommendation.title.trim() || 'Personalized course',
    description:
      recommendation.description.trim() || describeCourse(unitIds),
    rationale: rationaleFor(recommendation),
    mode: recommendation.preferredMode,
    unitIds,
    reasons: Object.fromEntries(
      unitIds.map((id) => [id, recommendation.reasons[id] || 'Included from the library.']),
    ),
    coverageNote: recommendation.coverageNote,
    engine: recommendation.engine,
    engineNote: recommendation.engineNote,
    completedUnitIds: [],
    resumeUnitId: null,
    createdAt: now,
    updatedAt: now,
    profile: {
      background: mapBackground(recommendation.backgroundId),
      backgroundId: recommendation.backgroundId,
      backgroundLabel: recommendation.background,
      goals: recommendation.goal,
      time: mapTime(recommendation.timeBudgetMinutes),
      timeMinutes: recommendation.timeBudgetMinutes,
      timeLabel: formatMinutes(recommendation.timeBudgetMinutes),
      source,
      knownPhrases: recommendation.knownPhrases,
    },
  }
}
