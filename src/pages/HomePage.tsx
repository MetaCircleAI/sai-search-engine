import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { SearchBar } from '../components/SearchBar'
import { UnitCard } from '../components/UnitCard'
import { courseStats, continueUnitId } from '../courses/format'
import { removeCourse, useCourses } from '../courses/storage'
import type { PersonalizedCourse } from '../courses/types'
import { suggestedConcepts } from '../knowledge/registry'
import { searchUnits, suggestUnits } from '../knowledge/search'

const PLACEHOLDER = 'What AI Concepts do you want to learn today?'

export function HomePage() {
  const navigate = useNavigate()
  const courses = useCourses()
  const [query, setQuery] = useState('')
  const [committed, setCommitted] = useState('')
  const concepts = useMemo(() => suggestedConcepts(), [])

  const suggestions = useMemo(
    () =>
      query.trim() && query.trim() !== committed ? suggestUnits(query, 6) : [],
    [query, committed],
  )
  const results = useMemo(
    () => (committed ? searchUnits(committed) : []),
    [committed],
  )

  useEffect(() => {
    if (window.location.hash !== '#my-courses') return
    document.getElementById('my-courses')?.scrollIntoView({ block: 'start' })
  }, [courses.length])

  const searching = committed.length > 0

  return (
    <div className="min-h-full overflow-auto">
      {searching ? (
        <header className="flex items-center gap-4 px-5 py-4 sm:px-8">
          <BrandMark compact />
          <div className="min-w-0 max-w-2xl flex-1">
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={(value) => {
                setCommitted(value)
                setQuery(value)
              }}
              suggestions={suggestions}
              onPickSuggestion={(unit) => navigate(`/u/${unit.id}`)}
              placeholder={PLACEHOLDER}
              autoFocus
            />
          </div>
        </header>
      ) : (
        <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pb-24 pt-[max(1.5rem,calc(40vh-5rem))]">
          <BrandMark wordmark />
          <div className="mt-8 w-full">
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={(value) => {
                setCommitted(value)
                setQuery(value)
              }}
              suggestions={suggestions}
              onPickSuggestion={(unit) => navigate(`/u/${unit.id}`)}
              placeholder={PLACEHOLDER}
              autoFocus
              large
            />
          </div>

          {concepts.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {concepts.map((concept) => (
                <button
                  key={concept.id}
                  type="button"
                  className="chip chip-lg"
                  onClick={() => navigate(`/u/${concept.id}`)}
                >
                  {concept.label}
                </button>
              ))}
            </div>
          )}

          <Link
            to="/personalize"
            className="group mt-8 flex w-full items-center gap-4 rounded-2xl border border-[var(--border-subtle)] bg-white px-5 py-4 text-left no-underline shadow-[var(--shadow-soft)] hover:border-[var(--accent)]"
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <Sparkles className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[18px] font-semibold tracking-tight text-[var(--text)]">
                Personalize My Course
              </span>
              <span className="mt-0.5 block text-[16px] leading-snug text-[var(--text-secondary)]">
                Tell us what you want to learn. We'll build a learning path just for you.
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--accent)]" />
          </Link>

          {courses.length > 0 && (
            <section id="my-courses" className="mt-14 w-full scroll-mt-8 border-t border-[var(--border-subtle)] pt-8">
              <h2 className="m-0 text-[16px] font-medium tracking-wide text-[var(--text-secondary)]">
                My Courses
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                {courses.map((course) => (
                  <CourseRow key={course.id} course={course} />
                ))}
              </div>
            </section>
          )}
        </main>
      )}

      {searching && (
        <section className="mx-auto mt-6 max-w-3xl px-6 pb-20">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="m-0 text-[15px] font-medium text-[var(--text-secondary)]">
              {results.length} result{results.length === 1 ? '' : 's'} for
              <span className="text-[var(--text)]"> “{committed}”</span>
            </h2>
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent text-[13px] text-[var(--accent)] hover:underline"
              onClick={() => {
                setCommitted('')
                setQuery('')
              }}
            >
              Clear
            </button>
          </div>
          {results.length === 0 ? (
            <p className="text-[14px] text-[var(--text-secondary)]">
              No matching knowledge units. Try a broader term like “attention” or
              “gradient”.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((hit, index) => (
                <UnitCard key={hit.unit.id} unit={hit.unit} rank={index + 1} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function CourseRow({ course }: { course: PersonalizedCourse }) {
  const stats = courseStats(course)
  const nextId = continueUnitId(course)

  return (
    <article className="home-course rounded-2xl border border-[var(--border-subtle)] bg-white px-5 py-5 shadow-[var(--shadow-soft)]">
      <Link to={`/courses/${course.id}`} className="no-underline">
        <h3 className="m-0 text-[20px] font-semibold tracking-tight text-[var(--text)]">
          {course.title}
        </h3>
      </Link>
      <p className="mt-1 mb-0 text-[16px] text-[var(--text-secondary)]">{stats.summary}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[16px]">
          <Link
            to={`/courses/${course.id}/edit`}
            className="text-[var(--text-secondary)] no-underline hover:text-[var(--text)]"
          >
            Edit
          </Link>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-[16px] text-[var(--text-secondary)] hover:text-[var(--warning)]"
            onClick={() => {
              if (window.confirm(`Remove “${course.title}” from My Courses?`)) {
                removeCourse(course.id)
              }
            }}
          >
            Remove
          </button>
        </div>
        {nextId ? (
          <Link to={`/u/${nextId}?course=${course.id}`} className="btn-primary">
            Continue Learning
          </Link>
        ) : (
          <Link to={`/courses/${course.id}`} className="btn-secondary">
            Open
          </Link>
        )}
      </div>
    </article>
  )
}
