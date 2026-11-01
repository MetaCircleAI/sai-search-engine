import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CourseBuilder } from '../components/CourseBuilder'
import { FlowHeader } from '../components/FlowHeader'
import { RebuildCourse } from '../components/RebuildCourse'
import { canSaveCourse } from '../courses/format'
import { getCourse, updateCourse } from '../courses/storage'
import type { PersonalizedCourse } from '../courses/types'

export function CourseEditPage() {
  const { courseId = '' } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<PersonalizedCourse | null>(
    () => getCourse(courseId) ?? null,
  )
  const [busy, setBusy] = useState(false)

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

  const savable = canSaveCourse(course)

  function save() {
    if (!course || busy || !canSaveCourse(course)) return
    setBusy(true)
    const completed = course.completedUnitIds.filter((id) => course.unitIds.includes(id))
    const resume =
      course.resumeUnitId && course.unitIds.includes(course.resumeUnitId)
        ? course.resumeUnitId
        : null
    updateCourse(course.id, {
      title: course.title.trim(),
      description: course.description,
      rationale: course.rationale,
      mode: course.mode,
      unitIds: course.unitIds,
      reasons: course.reasons,
      coverageNote: course.coverageNote,
      engine: course.engine,
      engineNote: course.engineNote,
      profile: course.profile,
      completedUnitIds: completed,
      resumeUnitId: resume,
    })
    navigate(`/courses/${course.id}`)
  }

  return (
    <div className="min-h-full overflow-auto">
      <FlowHeader backTo={`/courses/${course.id}`} backLabel="Course" />
      <main className="mx-auto max-w-xl px-6 pb-20 pt-6">
        <p className="m-0 text-[12px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          Edit course
        </p>
        <div className="mt-4">
          <RebuildCourse course={course} onApply={setCourse} />
        </div>
        <div className="mt-4">
          <CourseBuilder course={course} onChange={setCourse} />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" disabled={!savable || busy} onClick={save}>
            Save changes
          </button>
          <Link to={`/courses/${course.id}`} className="btn-secondary">
            Cancel
          </Link>
        </div>
      </main>
    </div>
  )
}
