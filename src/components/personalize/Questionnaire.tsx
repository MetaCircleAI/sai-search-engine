import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { recommend } from '../../personalize/advisor'
import {
  BACKGROUND_OPTIONS,
  MODE_OPTIONS,
  TIME_PRESETS,
  backgroundLabel,
  type BackgroundId,
  type PreferredMode,
  type Recommendation,
} from '../../personalize/types'

const GOAL_EXAMPLES = [
  'I want to understand how Transformers work.',
  'I want to learn the physics of neural network training.',
  'I want to understand grokking and generalization.',
]

type Props = {
  onBack: () => void
  onComplete: (recommendation: Recommendation) => void
}

export function Questionnaire({ onBack, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [backgroundId, setBackgroundId] = useState<BackgroundId | null>(null)
  const [otherText, setOtherText] = useState('')
  const [goal, setGoal] = useState('')
  const [timeId, setTimeId] = useState<string | null>(null)
  const [customValue, setCustomValue] = useState('90')
  const [customUnit, setCustomUnit] = useState<'min' | 'hr'>('min')
  const [mode, setMode] = useState<PreferredMode | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const customMinutes = (() => {
    const amount = Number(customValue)
    if (!Number.isFinite(amount) || amount <= 0) return null
    return Math.round(customUnit === 'hr' ? amount * 60 : amount)
  })()

  const timeMinutes =
    timeId === 'custom'
      ? customMinutes
      : (TIME_PRESETS.find((preset) => preset.id === timeId)?.minutes ?? null)

  const ready = [
    backgroundId != null,
    goal.trim().length >= 3,
    timeMinutes != null && timeMinutes >= 15,
    mode != null,
  ]

  const build = async () => {
    if (!backgroundId || !mode || !timeMinutes || goal.trim().length < 3) return
    setBusy(true)
    setError(null)
    try {
      const recommendation = await recommend({
        goal: goal.trim(),
        backgroundId,
        backgroundLabel: backgroundLabel(backgroundId, otherText),
        timeMinutes,
        preferredMode: mode,
        knownPhrases: [],
      })
      onComplete(recommendation)
    } catch {
      setError('The path could not be built. Try again.')
      setBusy(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => (step === 0 ? onBack() : setStep((n) => n - 1))}
        className="inline-flex items-center gap-1.5 bg-transparent border-0 p-0 text-[13px] text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {step === 0 ? 'Both options' : 'Back'}
      </button>
      <p className="mt-4 mb-0 text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
        Question {step + 1} of 4
      </p>
      <div className="mt-2 mb-6 flex gap-1.5" aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full ${
              index <= step ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
            }`}
          />
        ))}
      </div>

      {step === 0 && (
        <fieldset className="m-0 border-0 p-0">
          <legend className="p-0 text-[24px] font-semibold tracking-tight">
            What’s your background?
          </legend>
          <div className="mt-4 grid gap-2">
            {BACKGROUND_OPTIONS.map((option) => {
              const selected = backgroundId === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setBackgroundId(option.id)}
                  className={`rounded-2xl border px-4 py-3 text-left cursor-pointer bg-white ${
                    selected
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border-subtle)] hover:border-[var(--border)]'
                  }`}
                >
                  <span className="block text-[14px] font-medium">{option.label}</span>
                  <span className="mt-0.5 block text-[12px] text-[var(--text-secondary)]">
                    {option.hint}
                  </span>
                </button>
              )
            })}
          </div>
          {backgroundId === 'other' && (
            <input
              value={otherText}
              onChange={(event) => setOtherText(event.target.value)}
              placeholder="A few words, if you want"
              className="mt-3 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[var(--accent)]"
            />
          )}
        </fieldset>
      )}

      {step === 1 && (
        <div>
          <h1 className="m-0 text-[24px] font-semibold tracking-tight">
            What do you want to learn?
          </h1>
          <textarea
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            rows={3}
            placeholder="I want to understand how Transformers work."
            className="mt-4 w-full resize-none rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-[var(--accent)]"
          />
          <div className="mt-3 flex flex-col gap-2">
            {GOAL_EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setGoal(example)}
                className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-left text-[12px] text-[var(--text-secondary)] cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <fieldset className="m-0 border-0 p-0">
          <legend className="p-0 text-[24px] font-semibold tracking-tight">
            How much time do you have?
          </legend>
          <div className="mt-4 flex flex-wrap gap-2">
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setTimeId(preset.id)}
                className={`rounded-full border px-3.5 py-2 text-[13px] cursor-pointer ${
                  timeId === preset.id
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                    : 'border-[var(--border)] bg-white text-[var(--text-secondary)]'
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTimeId('custom')}
              className={`rounded-full border px-3.5 py-2 text-[13px] cursor-pointer ${
                timeId === 'custom'
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                  : 'border-[var(--border)] bg-white text-[var(--text-secondary)]'
              }`}
            >
              Custom
            </button>
          </div>
          {timeId === 'custom' && (
            <div className="mt-4 flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={customValue}
                onChange={(event) => setCustomValue(event.target.value)}
                className="w-24 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[14px] outline-none focus:border-[var(--accent)]"
              />
              <div className="mode-switch" role="group" aria-label="Time unit">
                <button
                  type="button"
                  className={customUnit === 'min' ? 'active' : ''}
                  onClick={() => setCustomUnit('min')}
                >
                  minutes
                </button>
                <button
                  type="button"
                  className={customUnit === 'hr' ? 'active' : ''}
                  onClick={() => setCustomUnit('hr')}
                >
                  hours
                </button>
              </div>
            </div>
          )}
          {timeId === 'custom' && customMinutes != null && customMinutes < 15 && (
            <p className="mt-2 mb-0 text-[12px] text-[var(--warning)]">
              Use at least 15 minutes so the path can include a unit.
            </p>
          )}
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="m-0 border-0 p-0">
          <legend className="p-0 text-[24px] font-semibold tracking-tight">
            How do you prefer to learn?
          </legend>
          <div className="mt-4 grid gap-2">
            {MODE_OPTIONS.map((option) => {
              const selected = mode === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMode(option.id)}
                  className={`rounded-2xl border px-4 py-3 text-left cursor-pointer bg-white ${
                    selected
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border-subtle)] hover:border-[var(--border)]'
                  }`}
                >
                  <span className="block text-[14px] font-medium">
                    {option.id === 'textbook'
                      ? 'Textbook Mode'
                      : option.id === 'discovery'
                        ? 'Discovery Mode'
                        : 'Mixed'}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-[var(--text-secondary)]">
                    {option.hint}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {error && <p className="mt-4 mb-0 text-[13px] text-[var(--warning)]">{error}</p>}

      <div className="mt-6">
        {step < 3 ? (
          <button
            type="button"
            disabled={!ready[step]}
            onClick={() => setStep((n) => n + 1)}
            className="rounded-full border-0 bg-[var(--accent)] px-4 py-2.5 text-[14px] font-medium text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={!ready.every(Boolean) || busy}
            onClick={() => void build()}
            className="rounded-full border-0 bg-[var(--accent)] px-4 py-2.5 text-[14px] font-medium text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? 'Selecting units…' : 'Build my path'}
          </button>
        )}
      </div>
    </div>
  )
}
