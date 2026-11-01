import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import {
  graphEdges,
  KNOWLEDGE_UNITS,
  learningPaths,
  type KnowledgeUnit,
} from '../knowledge/registry'

const COL_X = [120, 320, 520, 720, 920, 1120]
const ROW_GAP = 56

export function GraphPage() {
  const paths = learningPaths()
  const edges = useMemo(() => graphEdges(), [])
  const [hover, setHover] = useState<string | null>(null)

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number; unit: KnowledgeUnit }>()
    paths.forEach((path, col) => {
      path.units.forEach((unit, row) => {
        map.set(unit.id, {
          x: COL_X[col] ?? col * 200 + 120,
          y: 80 + row * ROW_GAP,
          unit,
        })
      })
    })
    return map
  }, [paths])

  const height = useMemo(() => {
    let max = 400
    for (const p of positions.values()) max = Math.max(max, p.y + 80)
    return max
  }, [positions])

  const connected = useMemo(() => {
    if (!hover) return new Set<string>()
    const s = new Set<string>([hover])
    for (const e of edges) {
      if (e.source === hover) s.add(e.target)
      if (e.target === hover) s.add(e.source)
    }
    return s
  }, [edges, hover])

  return (
    <div className="min-h-full overflow-auto">
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <BrandMark compact />
        <nav className="flex items-center gap-1 text-[13px]">
          <Link className="nav-link" to="/">
            Search
          </Link>
          <Link className="nav-link" to="/paths">
            Paths
          </Link>
        </nav>
      </header>

      <main className="px-6 sm:px-10 pb-16">
        <h1 className="m-0 text-[28px] font-semibold tracking-tight">
          Knowledge graph
        </h1>
        <p className="mt-2 mb-6 text-[15px] text-[var(--text-secondary)] max-w-2xl">
          Nodes are knowledge units. Edges follow the original course sequence
          within each section — no invented scientific relationships.
        </p>

        <div className="flex flex-wrap gap-4 mb-4 text-[12px] text-[var(--text-tertiary)]">
          {paths.map((p, i) => (
            <span key={p.id} className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]"
                style={{ opacity: 0.35 + i * 0.1 }}
              />
              {p.subtitle}
            </span>
          ))}
          <span className="ml-auto">{KNOWLEDGE_UNITS.length} nodes</span>
        </div>

        <div className="overflow-auto rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]">
          <svg
            width={1240}
            height={height}
            viewBox={`0 0 1240 ${height}`}
            role="img"
            aria-label="Knowledge graph of course units"
          >
            {edges.map((e) => {
              const a = positions.get(e.source)
              const b = positions.get(e.target)
              if (!a || !b) return null
              const active =
                !hover || connected.has(e.source) || connected.has(e.target)
              return (
                <line
                  key={`${e.source}-${e.target}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="var(--border)"
                  strokeWidth={1.25}
                  opacity={active ? 0.9 : 0.15}
                />
              )
            })}

            {[...positions.values()].map(({ x, y, unit }) => {
              const active = !hover || connected.has(unit.id)
              return (
                <Link key={unit.id} to={`/u/${unit.id}`}>
                  <g
                    onMouseEnter={() => setHover(unit.id)}
                    onMouseLeave={() => setHover(null)}
                    opacity={active ? 1 : 0.2}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={hover === unit.id ? 7 : 5.5}
                      fill={
                        hover === unit.id ? 'var(--accent)' : 'var(--bg-elevated)'
                      }
                      stroke="var(--accent)"
                      strokeWidth={1.5}
                    />
                    <text
                      x={x + 12}
                      y={y + 4}
                      fontSize={11}
                      fill="var(--text-secondary)"
                    >
                      {unit.title.length > 28
                        ? `${unit.title.slice(0, 26)}…`
                        : unit.title}
                    </text>
                  </g>
                </Link>
              )
            })}
          </svg>
        </div>
      </main>
    </div>
  )
}
