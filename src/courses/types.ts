export type CourseLearningMode = 'textbook' | 'discovery' | 'mixed'

export type BackgroundLevel = 'new' | 'some' | 'comfortable' | 'research'

export type TimeBudget = 'short' | 'medium' | 'long'

export type CourseSource = 'chat' | 'questionnaire'

/** Answers shared by the guided conversation and the questionnaire. */
export type CourseProfile = {
  background: BackgroundLevel
  /** Spec background id used by the advisor. Older saves may only have `background`. */
  backgroundId: string
  backgroundLabel: string
  goals: string
  time: TimeBudget
  timeMinutes: number
  timeLabel: string
  source: CourseSource
  knownPhrases: string[]
}

/**
 * A saved course stores ordered references to knowledge units.
 * Educational content stays in the registry and is not copied here.
 */
export type PersonalizedCourse = {
  id: string
  title: string
  description: string
  rationale: string
  mode: CourseLearningMode
  unitIds: string[]
  /** Why each registry id was included. Content is not copied. */
  reasons: Record<string, string>
  coverageNote: string | null
  engine: 'rules' | 'llm'
  engineNote: string | null
  completedUnitIds: string[]
  resumeUnitId: string | null
  createdAt: number
  updatedAt: number
  profile: CourseProfile
}
