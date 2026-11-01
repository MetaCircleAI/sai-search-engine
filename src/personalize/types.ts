export type PreferredMode = 'textbook' | 'discovery' | 'mixed'

export type BackgroundId =
  | 'beginner'
  | 'engineer'
  | 'math-physics'
  | 'researcher'
  | 'other'

/** About how long a typical knowledge unit takes in this prototype. */
export const UNIT_MINUTES = 15

export type PersonalizedLearningPath = {
  id: string
  title: string
  description: string
  goal: string
  background: string
  backgroundId: BackgroundId
  preferredMode: PreferredMode
  /** Things the learner said they already know. Used when regenerating. */
  knownPhrases: string[]
  /** Minutes the learner said they have, before the path was trimmed to units. */
  timeBudgetMinutes: number
  unitIds: string[]
  reasons: Record<string, string>
  estimatedMinutes: number
  coverageNote: string | null
  /** `rules` is the library advisor. `llm` is only set when an API was actually called. */
  engine: 'rules' | 'llm'
  engineNote: string | null
  createdAt: number
  updatedAt: number
}

export type CourseProgress = {
  pathId: string
  completedUnitIds: string[]
  lastUnitId: string | null
}

export type LearnerRequest = {
  goal: string
  backgroundId: BackgroundId
  backgroundLabel: string
  timeMinutes: number
  preferredMode: PreferredMode
  knownPhrases: string[]
}

export type Recommendation = Omit<
  PersonalizedLearningPath,
  'id' | 'createdAt' | 'updatedAt'
>

export type AdvisorTurn = {
  role: 'user' | 'assistant'
  content: string
}

export type AdvisorOutcome = {
  reply: string
  ready: boolean
  request: LearnerRequest | null
  recommendation: Recommendation | null
  engine: 'rules' | 'llm'
  engineNote: string | null
}

export const BACKGROUND_OPTIONS: {
  id: BackgroundId
  label: string
  hint: string
}[] = [
  { id: 'beginner', label: 'Beginner', hint: 'No prior AI knowledge' },
  { id: 'engineer', label: 'Software Engineer', hint: 'You build software' },
  { id: 'math-physics', label: 'Mathematics / Physics', hint: 'Quantitative background' },
  { id: 'researcher', label: 'Machine Learning Researcher', hint: 'You already work in ML' },
  { id: 'other', label: 'Other', hint: 'A different background' },
]

export const TIME_PRESETS: { id: string; label: string; minutes: number }[] = [
  { id: '30m', label: '30 minutes', minutes: 30 },
  { id: '2h', label: '2 hours', minutes: 120 },
  { id: '1d', label: '1 day', minutes: 360 },
  { id: '1w', label: '1 week', minutes: 600 },
]

export const MODE_OPTIONS: {
  id: PreferredMode
  label: string
  hint: string
}[] = [
  { id: 'textbook', label: 'Textbook', hint: 'Explanation first' },
  { id: 'discovery', label: 'Discovery', hint: 'Experiment first' },
  { id: 'mixed', label: 'Mixed', hint: 'Let the system decide' },
]

export function backgroundLabel(id: BackgroundId, other?: string): string {
  if (id === 'other') {
    const text = other?.trim()
    return text ? text : 'Other'
  }
  return BACKGROUND_OPTIONS.find((b) => b.id === id)?.label ?? 'Other'
}
