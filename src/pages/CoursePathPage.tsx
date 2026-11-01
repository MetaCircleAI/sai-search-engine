import { Link, useNavigate, useParams } from 'react-router-dom'
import { FlowHeader } from '../components/FlowHeader'
import { courseStats, continueUnitId, missingUnitIds, orderedLiveUnits } from '../courses/format'
import { getCourse, removeCourse } from '../courses/storage'

export function CoursePathPage() {
  const { courseId = '' } = useParams()
  const navigate = useNavigate()
  const course = getCourse(courseId)

  if (!course) {
    return (
      <div className="min-h-full overflow-auto">
        <FlowHeader backTo="/#my-courses" backLabel="My Courses" />
        <main className="mx-auto max-w-xl px-6 pt-16">
          <p className="text-[15px] text-[var(--text-secondary)]">This course is not saved.</p>
          <Link to="/#my-courses" className="text-[var(--accent)]">
            Back to My Courses
          </Link>
        </main>
      </div>
    )
  }

  const stats = courseStats(course)
  const units = orderedLiveUnits(course.unitIds)
  const missing = missingUnitIds(course.unitIds)
  const nextId = continueUnitId(course)

  return (
    <div className="min-h-full overflow-auto">
      <FlowHeader backTo="/#my-courses" backLabel="My Courses" />
      <main className="mx-auto max-w-xl px-6 pb-20 pt-6">
        <h1 className="m-0 text-[28px] font-semibold tracking-tight">{course.title}</h1>
        <p className="mt-3 mb-0 text-[14px] leading-relaxed text-[var(--text-secondary)]">
          {course.description}
        </p>
        <p className="mt-3 mb-0 text-[13px] text-[var(--text-secondary)]">
          {stats.summary}
          <span className="mx-1.5 text-[var(--border)]">·</span>
          {stats.modeLabel}
        </p>
        {course.coverageNote && (
          <p className="mt-3 mb-0 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {course.coverageNote}
          </p>
        )}
        <div
          className="mt-3 h-1 max-w-[12rem] overflow-hidden rounded-full bg-[var(--border)]"
          role="progressbar"
          aria-valuenow={stats.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Course progress"
        >
          <div className="h-full bg-[var(--accent)]" style={{ width: `${stats.percent}%` }} />
        </div>
        <p className="mt-4 mb-0 text-[13px] leading-relaxed text-[var(--text-secondary)]">
          {course.rationale}
        </p>

        {missing.length > 0 && (
          <p className="mt-4 mb-0 text-[13px] text-[var(--text-tertiary)]">
            {missing.length} knowledge unit{missing.length === 1 ? '' : 's'} in this
            course {missing.length === 1 ? 'is' : 'are'} no longer available.
          </p>
        )}

        <ol className="m-0 mt-6 list-none overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white p-0">
          {units.map((unit, index) => {
            const done = course.completedUnitIds.includes(unit.id)
            const current = course.resumeUnitId === unit.id && !done
            return (
              <li
                key={unit.id}
                className="border-b border-[var(--border-subtle)] last:border-b-0"
              >
                <Link
                  to={`/u/${unit.id}?course=${course.id}`}
                  className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-[var(--bg)]"
                >
                  <span className="w-6 shrink-0 text-right font-mono text-[12px] text-[var(--text-tertiary)]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-[var(--text)]">
                      {unit.title}
                    </span>
                    <span className="block truncate text-[12px] text-[var(--text-tertiary)]">
                      {unit.description}
                    </span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-[var(--accent-strong)]">
                      {course.reasons[unit.id] ?? 'Included in your saved path.'}
                    </span>
                  </span>
                  {done && (
                    <span className="text-[12px] text-[var(--accent)]">Done</span>
                  )}
                  {current && (
                    <span className="text-[12px] text-[var(--text-secondary)]">Current</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ol>

        {units.length === 0 && (
          <p className="mt-4 text-[14px] text-[var(--text-secondary)]">
            None of the saved units are in the library anymore. Edit the course to
            add current ones, or remove it.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {nextId && (
            <Link to={`/u/${nextId}?course=${course.id}`} className="btn-primary">
              Continue Learning
            </Link>
          )}
          <Link to={`/courses/${course.id}/edit`} className="btn-secondary">
            Edit
          </Link>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (!window.confirm(`Remove “${course.title}” from My Courses?`)) return
              removeCourse(course.id)
              navigate('/#my-courses')
            }}
          >
            Remove
          </button>
        </div>
      </main>
    </div>
  )
}
