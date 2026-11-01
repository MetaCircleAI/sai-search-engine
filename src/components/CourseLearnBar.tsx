import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { courseStats, formatDuration, liveUnitIds } from '../courses/format'
import { getUnit } from '../knowledge/registry'
import { updateCourse } from '../courses/storage'
import type { PersonalizedCourse } from '../courses/types'

export function CourseLearnBar({
  course,
  unitId,
  onCourseChange,
}: {
  course: PersonalizedCourse
  unitId: string
  onCourseChange: (course: PersonalizedCourse) => void
}) {
  const navigate = useNavigate()
  const [outline, setOutline] = useState(false)
  const live = liveUnitIds(course.unitIds)
  const index = live.indexOf(unitId)
  const remaining = live.filter((id) => !course.completedUnitIds.includes(id)).length
  const stats = courseStats(course)
  const prevId = index > 0 ? live[index - 1] : null
  const nextId = index >= 0 && index < live.length - 1 ? live[index + 1] : null
  const done = course.completedUnitIds.includes(unitId)

  function go(next: string | null, markComplete: boolean) {
    const completed =
      markComplete && !done ? [...course.completedUnitIds, unitId] : course.completedUnitIds
    const updated = updateCourse(course.id, {
      completedUnitIds: completed,
      resumeUnitId: next ?? unitId,
    })
    if (updated) onCourseChange(updated)
    if (next) navigate(`/u/${next}?course=${course.id}`)
    else if (markComplete) navigate(`/courses/${course.id}`)
  }

  if (index < 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] px-5 py-2.5 text-[13px] sm:px-8">
        <p className="m-0 text-[var(--text-secondary)]">
          This unit is outside “{course.title}”. Related concepts stay open.
        </p>
        <Link to={`/courses/${course.id}`} className="text-[var(--accent)] no-underline">
          Return to personalized course
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[var(--border-subtle)] px-5 py-2.5 text-[13px] sm:px-8">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
        <Link to="/#my-courses" className="text-[var(--accent)] no-underline">
          Back to My Courses
        </Link>
        <Link
          to={`/courses/${course.id}`}
          className="max-w-[16rem] truncate text-[var(--text-secondary)] no-underline hover:text-[var(--text)]"
        >
          {course.title}
        </Link>
      </div>
      <div
        className="flex items-center gap-3 text-[var(--text-secondary)]"
        role="progressbar"
        aria-valuenow={stats.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Course progress"
      >
        <span>
          {index + 1} of {stats.total}
          <span className="mx-1.5 text-[var(--border)]">·</span>
          {formatDuration(remaining)} left
        </span>
        <span className="h-1 w-16 overflow-hidden rounded-full bg-[var(--border)]" aria-hidden>
          <span
            className="block h-full bg-[var(--accent)]"
            style={{ width: `${stats.percent}%` }}
          />
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary"
          disabled={!prevId}
          onClick={() => prevId && go(prevId, false)}
        >
          Previous Unit
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={!nextId && done}
          onClick={() => go(nextId, true)}
        >
          {nextId ? 'Next Unit' : 'Finish'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          aria-expanded={outline}
          onClick={() => setOutline((open) => !open)}
        >
          Outline
        </button>
      </div>
      {outline && (
        <ol className="mt-2 max-h-48 w-full list-decimal overflow-auto pl-5 text-[13px]">
          {live.map((id) => {
            const current = id === unitId
            const complete = course.completedUnitIds.includes(id)
            return (
              <li key={id} className={current ? 'text-[var(--text)]' : 'text-[var(--text-secondary)]'}>
                <Link to={`/u/${id}?course=${course.id}`} className="no-underline hover:underline" style={{ color: 'inherit' }}>
                  {getUnit(id)?.title ?? id}
                  {complete ? ' · done' : ''}
                  {current ? ' · current' : ''}
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
