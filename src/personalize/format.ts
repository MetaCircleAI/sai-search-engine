import { UNIT_MINUTES, type BackgroundId, type PreferredMode } from './types'

export function slotCount(timeMinutes: number): number {
  if (timeMinutes <= 40) return 2
  if (timeMinutes <= 90) return 4
  if (timeMinutes <= 150) return 8
  if (timeMinutes <= 240) return 10
  if (timeMinutes <= 480) return 14
  return 20
}

export function minutesForCount(count: number): number {
  return Math.max(0, count) * UNIT_MINUTES
}

export function formatMinutes(mins: number): string {
  if (mins <= 0) return '0 min'
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const rest = mins % 60
  const hourLabel = hours === 1 ? '1 hour' : `${hours} hours`
  if (rest === 0) return hourLabel
  return `${hourLabel} ${rest} min`
}

/** Mixed mode picks a concrete unit-page order from the learner's background. */
export function resolvedMode(
  mode: PreferredMode,
  backgroundId: BackgroundId,
): 'textbook' | 'discovery' {
  if (mode === 'textbook' || mode === 'discovery') return mode
  if (backgroundId === 'beginner' || backgroundId === 'engineer') return 'discovery'
  return 'textbook'
}

export function modeSummary(
  mode: PreferredMode,
  backgroundId: BackgroundId,
): string {
  if (mode === 'textbook') return 'Textbook · explanation first'
  if (mode === 'discovery') return 'Discovery · experiment first'
  const start = resolvedMode(mode, backgroundId)
  return start === 'discovery'
    ? 'Mixed · starts with the experiment'
    : 'Mixed · starts with the explanation'
}

export function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  return `${flat.slice(0, max - 1).trim()}…`
}
