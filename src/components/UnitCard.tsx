import { Link } from 'react-router-dom'
import type { KnowledgeUnit } from '../knowledge/registry'

export function UnitCard({
  unit,
  rank,
  courseId,
}: {
  unit: KnowledgeUnit
  rank?: number
  courseId?: string
}) {
  const to = courseId
    ? `/u/${unit.id}?course=${encodeURIComponent(courseId)}`
    : `/u/${unit.id}`
  return (
    <Link
      to={to}
      className="
        group block no-underline text-[var(--text)]
        rounded-2xl border border-[var(--border-subtle)] bg-white
        px-5 py-4 shadow-[var(--shadow-soft)]
        hover:border-[var(--border)] hover:bg-[var(--bg-elevated)]
        transition-colors
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {rank != null && (
              <span className="text-[12px] font-mono text-[var(--text-tertiary)]">
                {rank}
              </span>
            )}
            <h3 className="m-0 text-[16px] font-semibold tracking-tight group-hover:text-[var(--accent-strong)]">
              {unit.title}
            </h3>
          </div>
          <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {unit.description}
          </p>
        </div>
        <span className="shrink-0 text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] border border-[var(--border-subtle)] rounded-full px-2.5 py-1">
          {unit.category}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {unit.keywords.slice(0, 5).map((k) => (
          <span
            key={k}
            className="text-[11px] text-[var(--text-tertiary)] bg-[var(--bg)] rounded-full px-2 py-0.5"
          >
            {k}
          </span>
        ))}
      </div>
    </Link>
  )
}
