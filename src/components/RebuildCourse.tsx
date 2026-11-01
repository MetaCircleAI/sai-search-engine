import { useState } from 'react'
import { courseFromRecommendation } from '../courses/fromRecommendation'
import type { PersonalizedCourse } from '../courses/types'
import { recommend } from '../personalize/advisor'
import {
  BACKGROUND_OPTIONS,
  MODE_OPTIONS,
  TIME_PRESETS,
  backgroundLabel,
  type BackgroundId,
  type PreferredMode,
} from '../personalize/types'

export function RebuildCourse({
  course,
  onApply,
}: {
  course: PersonalizedCourse
  onApply: (course: PersonalizedCourse) => void
}) {
  const [open, setOpen] = useState(false)
  const [backgroundId, setBackgroundId] = useState<BackgroundId>(
    (BACKGROUND_OPTIONS.some((option) => option.id === course.profile.backgroundId)
      ? course.profile.backgroundId
      : 'other') as BackgroundId,
  )
  const [otherText, setOtherText] = useState(
    course.profile.backgroundId === 'other' ? course.profile.backgroundLabel : '',
  )
  const [goal, setGoal] = useState(course.profile.goals)
  const preset = TIME_PRESETS.find((item) => item.minutes === course.profile.timeMinutes)
  const [timeId, setTimeId] = useState(preset?.id ?? 'custom')
  const [customMinutes, setCustomMinutes] = useState(String(course.profile.timeMinutes || 120))
  const [mode, setMode] = useState<PreferredMode>(course.mode)
  const [busy, setBusy] = useState(false)

  const minutes =
    timeId === 'custom'
      ? Number(customMinutes)
      : TIME_PRESETS.find((item) => item.id === timeId)?.minutes

  async function run() {
    if (!goal.trim() || !minutes || minutes < 15) return
    setBusy(true)
    try {
      const recommendation = await recommend({
        goal: goal.trim(),
        backgroundId,
        backgroundLabel: backgroundLabel(backgroundId, otherText),
        timeMinutes: minutes,
        preferredMode: mode,
        knownPhrases: course.profile.knownPhrases,
      })
      const fresh = courseFromRecommendation(recommendation, course.profile.source)
      onApply({
        ...fresh,
        id: course.id,
        createdAt: course.createdAt,
        completedUnitIds: [],
        resumeUnitId: null,
      })
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button type="button" className="btn-secondary" onClick={() => setOpen((value) => !value)}>
        Regenerate
      </button>
      {open && (
        <div className="mt-3 rounded-2xl border border-[var(--border-subtle)] bg-white p-4">
          <p className="m-0 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            Regenerating replaces the sequence with units from the library. Hand-added units are cleared.
          </p>
          <label className="mt-3 block text-[12px] text-[var(--text-tertiary)]">
            Goal
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={2}
              className="mt-1 w-full resize-none rounded-xl border border-[var(--border)] px-3 py-2 text-[14px] text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {BACKGROUND_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`chip ${backgroundId === option.id ? '!border-[var(--accent)] !text-[var(--accent-strong)]' : ''}`}
                onClick={() => setBackgroundId(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {backgroundId === 'other' && (
            <input
              value={otherText}
              onChange={(event) => setOtherText(event.target.value)}
              placeholder="Background"
              className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-[14px] outline-none"
            />
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {TIME_PRESETS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`chip ${timeId === option.id ? '!border-[var(--accent)] !text-[var(--accent-strong)]' : ''}`}
                onClick={() => setTimeId(option.id)}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              className={`chip ${timeId === 'custom' ? '!border-[var(--accent)] !text-[var(--accent-strong)]' : ''}`}
              onClick={() => setTimeId('custom')}
            >
              Custom
            </button>
          </div>
          {timeId === 'custom' && (
            <input
              type="number"
              min={15}
              value={customMinutes}
              onChange={(event) => setCustomMinutes(event.target.value)}
              className="mt-2 w-28 rounded-xl border border-[var(--border)] px-3 py-2 text-[14px]"
            />
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {MODE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`chip ${mode === option.id ? '!border-[var(--accent)] !text-[var(--accent-strong)]' : ''}`}
                onClick={() => setMode(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn-primary mt-4"
            disabled={busy || !goal.trim() || !minutes || minutes < 15}
            onClick={() => void run()}
          >
            {busy ? 'Selecting units…' : 'Replace with a new path'}
          </button>
        </div>
      )}
    </div>
  )
}
