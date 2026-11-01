import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, FlaskConical } from 'lucide-react'
import { AsidePage } from '@course/components/AsidePage'
import { LessonFlowContext } from '@course/components/LessonShell'
import { screensForLesson } from '@course/lib/lessonFlow'
import type { SavedPassage, ScreenId } from '@course/types'
import { BrandMark } from '../components/BrandMark'
import { CourseLearnBar } from '../components/CourseLearnBar'
import { UnitCard } from '../components/UnitCard'
import { getCourse, updateCourse } from '../courses/storage'
import type { PersonalizedCourse } from '../courses/types'
import {
  getUnit,
  modeScreenOrder,
  nextInPath,
  prevInPath,
  type LearningMode,
} from '../knowledge/registry'

const MODE_KEY = 'mc-explore-mode'

function loadMode(): LearningMode {
  try {
    return localStorage.getItem(MODE_KEY) === 'discovery' ? 'discovery' : 'textbook'
  } catch {
    return 'textbook'
  }
}

function coreOrder(mode: LearningMode, lessonId: string): ScreenId[] {
  const allowed = new Set(screensForLesson(lessonId as never))
  const ordered: ScreenId[] = modeScreenOrder(mode).filter((s) => allowed.has(s))
  // Preserve optional asides after core explanation/experiment when present.
  for (const s of ['nature', 'story'] as ScreenId[]) {
    if (allowed.has(s) && !ordered.includes(s)) ordered.push(s)
  }
  return ordered
}

export function UnitPage() {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const courseId = searchParams.get('course')
  const unit = getUnit(id)
  const navigate = useNavigate()
  const [mode, setMode] = useState<LearningMode>(loadMode)
  const [passages, setPassages] = useState<SavedPassage[]>([])
  const [activeCourse, setActiveCourse] = useState<PersonalizedCourse | null>(null)

  const order = useMemo(
    () => (unit ? coreOrder(mode, unit.id) : []),
    [mode, unit],
  )

  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode)
    } catch {
      /* */
    }
  }, [mode])

  useEffect(() => {
    if (!courseId || !unit) {
      setActiveCourse(null)
      return
    }
    const found = getCourse(courseId)
    if (!found) {
      setActiveCourse(null)
      return
    }
    const inside = found.unitIds.includes(unit.id)
    if (!inside) {
      setActiveCourse(found)
      return
    }
    if (found.resumeUnitId === unit.id) {
      setActiveCourse(found)
      return
    }
    setActiveCourse(updateCourse(found.id, { resumeUnitId: unit.id }) ?? found)
  }, [courseId, unit])

  useEffect(() => {
    if (!courseId) return
    const found = getCourse(courseId)
    if (!found) return
    if (found.mode === 'textbook' || found.mode === 'discovery') {
      setMode(found.mode)
      return
    }
    const background = found.profile.backgroundId
    setMode(
      background === 'beginner' || background === 'engineer' || background === 'new'
        ? 'discovery'
        : 'textbook',
    )
  }, [courseId])

  const onMark = useCallback(
    (d: { cardTitle: string; text: string; kind: SavedPassage['kind'] }) => {
      if (!unit) return
      setPassages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          lessonId: unit.id,
          cardTitle: d.cardTitle,
          text: d.text,
          kind: d.kind,
        },
      ])
    },
    [unit],
  )

  const onRemoveMark = useCallback(
    (cardTitle: string, text: string, kind: SavedPassage['kind']) => {
      setPassages((prev) =>
        prev.filter(
          (p) => !(p.cardTitle === cardTitle && p.text === text && p.kind === kind),
        ),
      )
    },
    [],
  )

  if (!unit) {
    return (
      <div className="min-h-full overflow-auto p-10">
        <BrandMark compact />
        <p className="mt-10 text-[var(--text-secondary)]">
          Knowledge unit not found.
        </p>
        <Link to="/" className="text-[var(--accent)]">
          Back to search
        </Link>
      </div>
    )
  }

  const Lesson = unit.component
  const related = unit.relatedIds.map((rid) => getUnit(rid)).filter(Boolean)
  const prev = prevInPath(unit.id)
  const next = nextInPath(unit.id)

  return (
    <div className="min-h-full bg-[var(--bg)]">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg)]">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 sm:px-8 py-3">
          <div className="flex items-center gap-3">
            <BrandMark compact />
            <span className="hidden sm:inline text-[var(--border)]">|</span>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text)] bg-transparent border-0 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <Link
              to="/"
              className="sm:hidden text-[13px] text-[var(--text-secondary)] no-underline"
            >
              Search
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="mode-switch" role="group" aria-label="Learning mode">
              <button
                type="button"
                className={mode === 'textbook' ? 'active' : ''}
                onClick={() => setMode('textbook')}
                title="Explanation, then the experiment"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Textbook
              </button>
              <button
                type="button"
                className={mode === 'discovery' ? 'active' : ''}
                onClick={() => setMode('discovery')}
                title="Experiment, then the explanation"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Discovery
              </button>
            </div>
            <Link to="/paths" className="nav-link unit-header-paths">
              Paths
            </Link>
          </div>
        </div>

        <div className="px-5 sm:px-8 pb-3 max-w-5xl">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h1 className="m-0 text-[22px] sm:text-[26px] font-semibold tracking-tight">
              {unit.title}
            </h1>
            <span className="text-[12px] font-mono text-[var(--text-tertiary)]">
              {unit.sourceIndex} · {unit.sourceChapter}
            </span>
          </div>
          <p className="mt-1 mb-2 text-[14px] text-[var(--text-secondary)] max-w-2xl">
            {unit.description}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="chip">{unit.category}</span>
            {unit.keywords.slice(0, 4).map((k) => (
              <span key={k} className="chip muted">
                {k}
              </span>
            ))}
          </div>
          <p className="mt-3 mb-0 text-[13px] text-[var(--text-tertiary)]">
            {mode === 'textbook'
              ? 'Explanation, then the interactive experiment, then a short check.'
              : 'The interactive experiment comes first, then the explanation.'}
          </p>
        </div>
        {activeCourse && (
          <CourseLearnBar
            course={activeCourse}
            unitId={unit.id}
            onCourseChange={setActiveCourse}
          />
        )}
      </header>

      <LessonFlowContext.Provider
        value={{
          isLastInSection: !next,
          knowledgeContinueLabel: 'Continue →',
        }}
      >
        <article className="unit-article">
          {order.map((s) => (
            <section key={s} className="unit-article-section">
              {s === 'nature' || s === 'story' ? (
                <AsidePage
                  lesson={unit.id}
                  kind={s}
                  onNext={() => {}}
                  onSkip={() => {}}
                />
              ) : (
                <Lesson
                  screen={s}
                  passages={passages}
                  onMark={onMark}
                  onRemoveMark={onRemoveMark}
                  onScreenComplete={() => {}}
                  onAdvance={() => {}}
                />
              )}
            </section>
          ))}
        </article>
      </LessonFlowContext.Provider>

      <section className="border-t border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-8 pb-14">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="m-0 text-[15px] font-semibold tracking-tight">
              Related knowledge units
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
              {prev && (
                <Link
                  to={courseId ? `/u/${prev}?course=${courseId}` : `/u/${prev}`}
                  className="text-[var(--accent)] no-underline"
                >
                  ← {getUnit(prev)?.title}
                </Link>
              )}
              {next && (
                <Link
                  to={courseId ? `/u/${next}?course=${courseId}` : `/u/${next}`}
                  className="text-[var(--accent)] no-underline"
                >
                  {getUnit(next)?.title} →
                </Link>
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            {related.slice(0, 4).map((r) =>
              r ? (
                <UnitCard
                  key={r.id}
                  unit={r}
                  courseId={courseId ?? undefined}
                />
              ) : null,
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            <Link
              to="/"
              className="text-[var(--text-tertiary)] no-underline hover:text-[var(--text)]"
            >
              Back to search
            </Link>
            <Link
              to={`/paths/${unit.sectionId}`}
              className="text-[var(--text-tertiary)] no-underline hover:text-[var(--text)]"
            >
              View learning path
            </Link>
            {courseId && (
              <Link
                to={`/courses/${courseId}`}
                className="text-[var(--text-tertiary)] no-underline hover:text-[var(--text)]"
              >
                Return to personalized course
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
