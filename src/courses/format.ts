import { getUnit, type KnowledgeUnit } from '../knowledge/registry'
import { modeLabel } from './options'
import type { PersonalizedCourse } from './types'

export const MINUTES_PER_UNIT = 15

export function formatDuration(unitCount: number): string {
  const minutes = Math.max(0, unitCount) * MINUTES_PER_UNIT
  if (minutes <= 0) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  if (rem === 0) return hours === 1 ? '1 hour' : `${hours} hours`
  return `${hours} hr ${rem} min`
}

export function orderedLiveUnits(unitIds: string[]): KnowledgeUnit[] {
  const units: KnowledgeUnit[] = []
  for (const id of unitIds) {
    const unit = getUnit(id)
    if (unit) units.push(unit)
  }
  return units
}

export function liveUnitIds(unitIds: string[]): string[] {
  return unitIds.filter((id) => getUnit(id))
}

export function missingUnitIds(unitIds: string[]): string[] {
  return unitIds.filter((id) => !getUnit(id))
}

export function describeCourse(unitIds: string[]): string {
  const units = orderedLiveUnits(unitIds)
  if (units.length === 0) {
    return 'Add knowledge units from the library to build this course.'
  }
  const categories = [...new Set(units.map((unit) => unit.category))]
  const span =
    categories.length <= 3
      ? categories.join(', ')
      : `${categories.slice(0, 2).join(', ')}, and related topics`
  return `A path through ${span}, using only knowledge units already in the library.`
}

export function courseStats(course: PersonalizedCourse) {
  const live = liveUnitIds(course.unitIds)
  const done = live.filter((id) => course.completedUnitIds.includes(id)).length
  const total = live.length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return {
    done,
    total,
    percent,
    missing: course.unitIds.length - total,
    duration: formatDuration(total),
    summary: `${total} unit${total === 1 ? '' : 's'} · ${formatDuration(total)} · ${percent}% completed`,
    modeLabel: modeLabel(course.mode),
  }
}

/** Where Continue Learning should open. */
export function continueUnitId(course: PersonalizedCourse): string | null {
  const live = liveUnitIds(course.unitIds)
  if (live.length === 0) return null
  const incomplete = live.filter((id) => !course.completedUnitIds.includes(id))
  if (
    course.resumeUnitId &&
    live.includes(course.resumeUnitId) &&
    !course.completedUnitIds.includes(course.resumeUnitId)
  ) {
    return course.resumeUnitId
  }
  if (incomplete.length > 0) return incomplete[0]
  if (course.resumeUnitId && live.includes(course.resumeUnitId)) {
    return course.resumeUnitId
  }
  return live[0]
}

export function canSaveCourse(course: PersonalizedCourse): boolean {
  return course.title.trim().length > 0 && orderedLiveUnits(course.unitIds).length > 0
}
