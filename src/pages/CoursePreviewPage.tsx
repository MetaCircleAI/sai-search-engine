import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CourseBuilder } from '../components/CourseBuilder'
import { FlowHeader } from '../components/FlowHeader'
import { RebuildCourse } from '../components/RebuildCourse'
import { canSaveCourse, orderedLiveUnits } from '../courses/format'
import { clearDraft, readDraft, upsertCourse, writeDraft } from '../courses/storage'
import type { PersonalizedCourse } from '../courses/types'

export function CoursePreviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const seeded = (location.state as { course?: PersonalizedCourse } | null)?.course
  const [course, setCourse] = useState<PersonalizedCourse | null>(
    () => seeded ?? readDraft(),
  )
  const [busy, setBusy] = useState(false)

  if (!course) return <Navigate to="/personalize" replace />

  const savable = canSaveCourse(course)

  function change(next: PersonalizedCourse) {
    writeDraft(next)
    setCourse(next)
  }

  function addToCourses() {
    if (!course || busy || !canSaveCourse(course)) return
    setBusy(true)
    upsertCourse({ ...course, title: course.title.trim() })
    clearDraft()
    navigate('/#my-courses', { replace: true })
  }

  function startLearning() {
    if (!course || busy || !canSaveCourse(course)) return
    const first = orderedLiveUnits(course.unitIds)[0]
    if (!first) return
    setBusy(true)
    const saved = upsertCourse({
      ...course,
      title: course.title.trim(),
      resumeUnitId: first.id,
    })
    clearDraft()
    navigate(`/u/${first.id}?course=${saved.id}`, { replace: true })
  }

  return (
    <div className="min-h-full overflow-auto">
      <FlowHeader backTo="/personalize" backLabel="Personalize" />
      <main className="mx-auto max-w-xl px-6 pb-20 pt-6">
        <p className="m-0 text-[12px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          Your personalized learning path
        </p>
        <div className="mt-4">
          <RebuildCourse course={course} onApply={change} />
        </div>
        <div className="mt-4">
          <CourseBuilder course={course} onChange={change} />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary"
            disabled={!savable || busy}
            onClick={addToCourses}
          >
            Add to My Courses
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={!savable || busy}
            onClick={startLearning}
          >
            Start learning
          </button>
        </div>
      </main>
    </div>
  )
}
