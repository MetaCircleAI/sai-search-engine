import type {
  BackgroundLevel,
  CourseLearningMode,
  TimeBudget,
} from './types'

export const BACKGROUND_OPTIONS: { id: BackgroundLevel; label: string }[] = [
  { id: 'new', label: 'New to machine learning' },
  { id: 'some', label: 'Some linear algebra and calculus' },
  { id: 'comfortable', label: 'Comfortable with neural networks' },
  { id: 'research', label: 'Research-level' },
]

export const TIME_OPTIONS: { id: TimeBudget; label: string; units: number }[] = [
  { id: 'short', label: 'Under an hour', units: 3 },
  { id: 'medium', label: 'A few hours', units: 8 },
  { id: 'long', label: 'A longer path', units: 14 },
]

export const MODE_OPTIONS: {
  id: CourseLearningMode
  label: string
  hint: string
}[] = [
  {
    id: 'textbook',
    label: 'Textbook',
    hint: 'Explanation, then the experiment',
  },
  {
    id: 'discovery',
    label: 'Discovery',
    hint: 'Experiment, then the explanation',
  },
  {
    id: 'mixed',
    label: 'Mixed',
    hint: 'Let the system decide',
  },
]

export function modeLabel(mode: CourseLearningMode): string {
  return MODE_OPTIONS.find((option) => option.id === mode)?.label ?? 'Mixed'
}

export function unitBudget(time: TimeBudget): number {
  return TIME_OPTIONS.find((option) => option.id === time)?.units ?? 8
}

export function matchBackground(text: string) {
  const q = text.trim().toLowerCase()
  if (!q) return null
  const byLabel = BACKGROUND_OPTIONS.find((option) =>
    q.includes(option.label.toLowerCase()),
  )
  if (byLabel) return byLabel
  if (/\b(research|phd|theor(y|ist)|advanced)\b/.test(q)) return BACKGROUND_OPTIONS[3]
  if (/\b(comfort|intermediate|neural|familiar|experienced)\b/.test(q)) {
    return BACKGROUND_OPTIONS[2]
  }
  if (/\b(some|algebra|calculus|undergrad|basic)\b/.test(q)) return BACKGROUND_OPTIONS[1]
  if (/\b(new|beginner|begin|start|none|zero)\b/.test(q) || q.includes('no experience')) {
    return BACKGROUND_OPTIONS[0]
  }
  return null
}

export function matchTime(text: string) {
  const q = text.trim().toLowerCase()
  if (!q) return null
  const byLabel = TIME_OPTIONS.find((option) => q.includes(option.label.toLowerCase()))
  if (byLabel) return byLabel
  if (/\b(long|week|month|longer|deep dive)\b/.test(q)) return TIME_OPTIONS[2]
  if (/\b(few hours|a few|couple|afternoon|several|medium|two hours|2 hours)\b/.test(q)) {
    return TIME_OPTIONS[1]
  }
  if (/\b(short|quick|brief|30|45|hour)\b/.test(q)) return TIME_OPTIONS[0]
  return null
}

export function matchMode(text: string) {
  const q = text.trim().toLowerCase()
  if (!q) return null
  if (/\bmixed\b|\bmix\b|\bboth\b/.test(q)) return MODE_OPTIONS[2]
  if (/discover/.test(q)) return MODE_OPTIONS[1]
  if (/textbook|explain|reading/.test(q)) return MODE_OPTIONS[0]
  return MODE_OPTIONS.find((option) => q.includes(option.label.toLowerCase())) ?? null
}
