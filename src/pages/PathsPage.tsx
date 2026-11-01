import { Link, useParams } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { UnitCard } from '../components/UnitCard'
import { learningPaths } from '../knowledge/registry'

export function PathsPage() {
  const { sectionId } = useParams()
  const paths = learningPaths()
  const selected = sectionId
    ? paths.find((p) => String(p.id) === sectionId)
    : null

  return (
    <div className="min-h-full overflow-auto">
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <BrandMark compact />
        <nav className="flex items-center gap-1 text-[13px]">
          <Link className="nav-link" to="/">
            Search
          </Link>
          <Link className="nav-link" to="/graph">
            Graph
          </Link>
        </nav>
      </header>

      <main className="px-6 sm:px-10 pb-20 mx-auto max-w-4xl">
        <h1 className="m-0 text-[28px] font-semibold tracking-tight">
          Learning paths
        </h1>
        <p className="mt-2 mb-8 text-[15px] text-[var(--text-secondary)] max-w-2xl">
          The original Science of AI course sections — each path is an ordered
          collection of the same searchable knowledge units.
        </p>

        {!selected && (
          <div className="grid sm:grid-cols-2 gap-3">
            {paths.map((path) => (
              <Link
                key={path.id}
                to={`/paths/${path.id}`}
                className="entry-card"
              >
                <div className="text-[12px] font-mono text-[var(--text-tertiary)]">
                  {path.title}
                </div>
                <h3>{path.subtitle}</h3>
                <p>{path.blurb}</p>
                <div className="mt-3 text-[12px] text-[var(--text-tertiary)]">
                  {path.units.length} units
                </div>
              </Link>
            ))}
          </div>
        )}

        {selected && (
          <>
            <Link
              to="/paths"
              className="text-[13px] text-[var(--accent)] no-underline"
            >
              ← All paths
            </Link>
            <div className="mt-3 mb-6">
              <div className="text-[12px] font-mono text-[var(--text-tertiary)]">
                {selected.title}
              </div>
              <h2 className="m-0 mt-1 text-[22px] font-semibold tracking-tight">
                {selected.subtitle}
              </h2>
              <p className="mt-1 mb-0 text-[14px] text-[var(--text-secondary)]">
                {selected.blurb}
              </p>
            </div>
            <ol className="m-0 p-0 list-none flex flex-col gap-3">
              {selected.units.map((unit, i) => (
                <li key={unit.id} className="flex gap-3 items-stretch">
                  <div className="w-8 shrink-0 pt-4 text-[13px] font-mono text-[var(--text-tertiary)] text-right">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <UnitCard unit={unit} />
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </main>
    </div>
  )
}
