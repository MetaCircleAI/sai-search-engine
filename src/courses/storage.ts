import { useEffect, useState } from 'react'
import type {
  BackgroundLevel,
  CourseLearningMode,
  CourseProfile,
  CourseSource,
  PersonalizedCourse,
  TimeBudget,
} from './types'

const KEY = 'mc-explore-courses'
const DRAFT_KEY = 'mc-explore-course-draft'
const CHANGE_EVENT = 'mc-courses'

const BACKGROUNDS = new Set<BackgroundLevel>(['new', 'some', 'comfortable', 'research'])
const TIMES = new Set<TimeBudget>(['short', 'medium', 'long'])
const MODES = new Set<CourseLearningMode>(['textbook', 'discovery', 'mixed'])
const SOURCES = new Set<CourseSource>(['chat', 'questionnaire'])

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function normalizeProfile(value: unknown): CourseProfile {
  const raw = (value ?? {}) as Partial<CourseProfile>
  const time = TIMES.has(raw.time as TimeBudget) ? (raw.time as TimeBudget) : 'medium'
  const timeMinutes =
    typeof raw.timeMinutes === 'number' && raw.timeMinutes > 0
      ? raw.timeMinutes
      : time === 'short'
        ? 30
        : time === 'long'
          ? 360
          : 120
  return {
    background: BACKGROUNDS.has(raw.background as BackgroundLevel)
      ? (raw.background as BackgroundLevel)
      : 'some',
    backgroundId: typeof raw.backgroundId === 'string' && raw.backgroundId
      ? raw.backgroundId
      : 'other',
    backgroundLabel:
      typeof raw.backgroundLabel === 'string' && raw.backgroundLabel
        ? raw.backgroundLabel
        : 'Not specified',
    goals: typeof raw.goals === 'string' ? raw.goals : '',
    time,
    timeMinutes,
    timeLabel:
      typeof raw.timeLabel === 'string' && raw.timeLabel ? raw.timeLabel : '2 hours',
    source: SOURCES.has(raw.source as CourseSource)
      ? (raw.source as CourseSource)
      : 'questionnaire',
    knownPhrases: strings(raw.knownPhrases),
  }
}

function normalizeReasons(value: unknown, unitIds: string[]): Record<string, string> {
  const reasons: Record<string, string> = {}
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  for (const id of unitIds) {
    const reason = raw[id]
    if (typeof reason === 'string' && reason.trim()) reasons[id] = reason.trim()
  }
  return reasons
}

export function normalizeCourse(value: unknown): PersonalizedCourse | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<PersonalizedCourse>
  if (typeof raw.id !== 'string' || typeof raw.title !== 'string') return null
  if (!Array.isArray(raw.unitIds)) return null
  const unitIds = strings(raw.unitIds)
  return {
    id: raw.id,
    title: raw.title,
    description: typeof raw.description === 'string' ? raw.description : '',
    rationale: typeof raw.rationale === 'string' ? raw.rationale : '',
    mode: MODES.has(raw.mode as CourseLearningMode)
      ? (raw.mode as CourseLearningMode)
      : 'mixed',
    unitIds,
    reasons: normalizeReasons(raw.reasons, unitIds),
    coverageNote: typeof raw.coverageNote === 'string' ? raw.coverageNote : null,
    engine: raw.engine === 'llm' ? 'llm' : 'rules',
    engineNote: typeof raw.engineNote === 'string' ? raw.engineNote : null,
    completedUnitIds: strings(raw.completedUnitIds),
    resumeUnitId: typeof raw.resumeUnitId === 'string' ? raw.resumeUnitId : null,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
    profile: normalizeProfile(raw.profile),
  }
}

export function loadCourses(): PersonalizedCourse[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeCourse)
      .filter((course): course is PersonalizedCourse => course != null)
  } catch {
    return []
  }
}

function persist(courses: PersonalizedCourse[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(courses))
  } catch {
    /* quota or private mode */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function getCourse(id: string): PersonalizedCourse | undefined {
  return loadCourses().find((course) => course.id === id)
}

/** Insert or replace by id so repeated saves do not create duplicates. */
export function upsertCourse(course: PersonalizedCourse): PersonalizedCourse {
  const all = loadCourses()
  const index = all.findIndex((item) => item.id === course.id)
  const stored: PersonalizedCourse = {
    ...course,
    title: course.title.trim(),
    createdAt: index >= 0 ? all[index].createdAt : course.createdAt,
    updatedAt: Date.now(),
  }
  if (index >= 0) all[index] = stored
  else all.unshift(stored)
  persist(all)
  return stored
}

export function updateCourse(
  id: string,
  patch: Partial<PersonalizedCourse>,
): PersonalizedCourse | null {
  const all = loadCourses()
  const index = all.findIndex((course) => course.id === id)
  if (index < 0) return null
  const next: PersonalizedCourse = {
    ...all[index],
    ...patch,
    id: all[index].id,
    createdAt: all[index].createdAt,
    updatedAt: Date.now(),
  }
  all[index] = next
  persist(all)
  return next
}

export function removeCourse(id: string) {
  persist(loadCourses().filter((course) => course.id !== id))
}

export function useCourses(): PersonalizedCourse[] {
  const [courses, setCourses] = useState<PersonalizedCourse[]>(loadCourses)
  useEffect(() => {
    const sync = () => setCourses(loadCourses())
    window.addEventListener(CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return courses
}

export function writeDraft(course: PersonalizedCourse) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(course))
  } catch {
    /* ignore */
  }
}

export function readDraft(): PersonalizedCourse | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return normalizeCourse(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignore */
  }
}
