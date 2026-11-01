import { Reorder, useDragControls } from 'framer-motion'
import { ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { describeCourse, formatDuration, MINUTES_PER_UNIT, missingUnitIds, orderedLiveUnits } from '../courses/format'
import { MODE_OPTIONS, modeLabel } from '../courses/options'
import type { CourseLearningMode, PersonalizedCourse } from '../courses/types'
import { getUnit } from '../knowledge/registry'
import { suggestUnits } from '../knowledge/search'
import { Link } from 'react-router-dom'

function withUnits(course: PersonalizedCourse, unitIds: string[]): PersonalizedCourse {
  return {
    ...course,
    unitIds,
    description: course.description.trim() || describeCourse(unitIds),
  }
}

export function CourseBuilder({
  course,
  onChange,
}: {
  course: PersonalizedCourse
  onChange: (course: PersonalizedCourse) => void
}) {
  const [query, setQuery] = useState('')
  const units = orderedLiveUnits(course.unitIds)
  const missing = missingUnitIds(course.unitIds)
  const known = useMemo(() => new Set(course.unitIds), [course.unitIds])
  const suggestions = query.trim()
    ? suggestUnits(query, 8).filter((unit) => !known.has(unit.id))
    : []

  function move(index: number, direction: -1 | 1) {
    const next = [...course.unitIds]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(withUnits(course, next))
  }

  function remove(id: string) {
    onChange(
      withUnits(
        course,
        course.unitIds.filter((unitId) => unitId !== id),
      ),
    )
  }

  function add(id: string) {
    if (known.has(id) || !getUnit(id)) return
    const next = withUnits(course, [...course.unitIds, id])
    onChange({
      ...next,
      reasons: {
        ...course.reasons,
        [id]: 'Added by you from the library.',
      },
    })
    setQuery('')
  }

  function setMode(mode: CourseLearningMode) {
    onChange({ ...course, mode })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <label className="block text-[12px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          Course title
        </label>
        <input
          value={course.title}
          onChange={(event) => onChange({ ...course, title: event.target.value })}
          className="mt-2 w-full border-0 border-b border-[var(--border)] bg-transparent px-0 py-2 text-[26px] font-semibold tracking-tight text-[var(--text)] outline-none focus:border-[var(--accent)]"
        />
        <p className="mt-3 mb-0 text-[14px] leading-relaxed text-[var(--text-secondary)]">
          {course.description}
        </p>
      </div>

      <p className="m-0 text-[13px] text-[var(--text-secondary)]">
        {units.length} unit{units.length === 1 ? '' : 's'}
        <span className="mx-1.5 text-[var(--border)]">·</span>
        {formatDuration(units.length)}
        <span className="mx-1.5 text-[var(--border)]">·</span>
        {modeLabel(course.mode)}
      </p>

      <div>
        <div className="text-[12px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          Learning mode
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`chip ${course.mode === option.id ? '!border-[var(--accent)] !text-[var(--accent-strong)]' : ''}`}
              onClick={() => setMode(option.id)}
              aria-pressed={course.mode === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p className="m-0 text-[13px] leading-relaxed text-[var(--text-secondary)]">
        {course.rationale}
      </p>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-[12px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
            Knowledge units
          </span>
          <span className="text-[12px] text-[var(--text-tertiary)]">Drag to reorder</span>
        </div>
        {course.unitIds.length === 0 ? (
          <p className="m-0 text-[14px] text-[var(--text-secondary)]">
            This course has no units yet. Add some from the library below.
          </p>
        ) : (
          <Reorder.Group
            as="div"
            axis="y"
            values={course.unitIds}
            onReorder={(unitIds) => onChange(withUnits(course, unitIds))}
            className="m-0 flex flex-col gap-2 p-0"
          >
            {course.unitIds.map((id, index) => (
              <CourseUnitRow
                key={id}
                id={id}
                index={index}
                total={course.unitIds.length}
                reason={course.reasons[id] ?? 'Included in your saved path.'}
                courseId={course.id}
                onUp={() => move(index, -1)}
                onDown={() => move(index, 1)}
                onRemove={() => remove(id)}
              />
            ))}
          </Reorder.Group>
        )}
        {missing.length > 0 && (
          <p className="mt-2 mb-0 text-[12px] text-[var(--text-tertiary)]">
            {missing.length} saved reference{missing.length === 1 ? '' : 's'} no longer
            resolve. Remove {missing.length === 1 ? 'it' : 'them'} or leave{' '}
            {missing.length === 1 ? 'it' : 'them'} out of the path.
          </p>
        )}
      </div>

      <div className="relative">
        <label className="block text-[12px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          Add a knowledge unit
        </label>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search the library"
          className="mt-2 w-full rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-[14px] text-[var(--text)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]"
        />
        {query.trim() && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-[var(--border)] bg-white p-0 shadow-[var(--shadow-soft)]">
            {suggestions.map((unit) => (
              <li key={unit.id}>
                <button
                  type="button"
                  className="w-full border-0 border-b border-[var(--border-subtle)] bg-transparent px-4 py-3 text-left last:border-b-0 hover:bg-[var(--bg)]"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => add(unit.id)}
                >
                  <div className="text-[14px] font-medium text-[var(--text)]">{unit.title}</div>
                  <div className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
                    {unit.category}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim() && suggestions.length === 0 && (
          <p className="mt-2 mb-0 text-[13px] text-[var(--text-secondary)]">
            No other matching knowledge units.
          </p>
        )}
      </div>
    </div>
  )
}

function CourseUnitRow({
  id,
  index,
  total,
  reason,
  courseId,
  onUp,
  onDown,
  onRemove,
}: {
  id: string
  index: number
  total: number
  reason: string
  courseId: string
  onUp: () => void
  onDown: () => void
  onRemove: () => void
}) {
  const controls = useDragControls()
  const unit = getUnit(id)
  const title = unit?.title ?? 'Unavailable unit'

  return (
    <Reorder.Item
      value={id}
      as="div"
      dragListener={false}
      dragControls={controls}
      className="rounded-2xl border border-[var(--border-subtle)] bg-white px-3 py-3"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="icon-btn mt-0.5 cursor-grab active:cursor-grabbing"
          aria-label={`Drag ${title}`}
          onPointerDown={(event) => controls.start(event)}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="mt-1.5 w-6 shrink-0 text-right font-mono text-[12px] text-[var(--text-tertiary)]">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[14px] font-medium text-[var(--text)]">{title}</span>
            {unit && (
              <span className="text-[12px] text-[var(--text-tertiary)]">
                {MINUTES_PER_UNIT} min
              </span>
            )}
          </div>
          <p className="mt-1 mb-0 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            {unit?.description ?? 'This unit is no longer in the library.'}
          </p>
          <p className="mt-1 mb-0 text-[12px] leading-relaxed text-[var(--accent-strong)]">
            {reason}
          </p>
          {unit && (
            <Link
              to={`/u/${unit.id}?course=${courseId}`}
              className="mt-1 inline-block text-[12px] text-[var(--accent)] no-underline hover:underline"
            >
              Open unit
            </Link>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="icon-btn"
            aria-label={`Move ${title} up`}
            disabled={index === 0}
            onClick={onUp}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Move ${title} down`}
            disabled={index === total - 1}
            onClick={onDown}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Remove ${title}`}
            onClick={onRemove}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Reorder.Item>
  )
}
