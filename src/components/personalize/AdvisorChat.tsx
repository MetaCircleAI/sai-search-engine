import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUp } from 'lucide-react'
import { openingMessage, runAdvisorTurn } from '../../personalize/advisor'
import { advisorEngine } from '../../personalize/llm'
import { formatMinutes } from '../../personalize/format'
import type { AdvisorTurn, Recommendation } from '../../personalize/types'

type Props = {
  onBack: () => void
  onComplete: (recommendation: Recommendation) => void
}

const EXAMPLE =
  "I'm a physics student and want to understand modern deep learning in two hours."

export function AdvisorChat({ onBack, onComplete }: Props) {
  const engine = advisorEngine()
  const [messages, setMessages] = useState<AdvisorTurn[]>([
    { role: 'assistant', content: openingMessage(engine) },
  ])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, recommendation])

  const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant')
  const suggestions = suggestionsFor(lastAssistant?.content ?? '')

  const send = async (text: string) => {
    const content = text.trim()
    if (!content || pending) return
    const history: AdvisorTurn[] = [...messages, { role: 'user', content }]
    setMessages(history)
    setDraft('')
    setPending(engine === 'llm')
    const outcome = await runAdvisorTurn(history)
    setMessages([...history, { role: 'assistant', content: outcome.reply }])
    setRecommendation(outcome.recommendation)
    setNote(outcome.engineNote)
    setPending(false)
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 bg-transparent border-0 p-0 text-[13px] text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Both options
      </button>
      <h1 className="m-0 mt-4 text-[24px] font-semibold tracking-tight">Chat with AI</h1>
      <p className="mt-1 mb-4 text-[13px] leading-relaxed text-[var(--text-secondary)]">
        {engine === 'llm'
          ? 'A language model is connected. It can select and sequence existing knowledge units only.'
          : 'No language model is connected. Replies are library rules, not a simulated model.'}
      </p>

      <div
        ref={listRef}
        className="flex max-h-[420px] flex-col gap-3 overflow-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg)] p-3"
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap ${
              message.role === 'user'
                ? 'self-end bg-[var(--accent)] text-white'
                : 'self-start bg-white text-[var(--text)] border border-[var(--border-subtle)]'
            }`}
          >
            {message.role === 'assistant' && (
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                {engine === 'llm' ? 'Language model' : 'Library advisor'}
              </span>
            )}
            {message.content}
          </div>
        ))}
        {pending && (
          <p className="m-0 self-start text-[12px] text-[var(--text-tertiary)]">
            Asking the language model…
          </p>
        )}
      </div>

      {suggestions.length > 0 && !recommendation && (
        <div className="mt-3 flex flex-col gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void send(suggestion)}
              className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-left text-[12px] text-[var(--text-secondary)] cursor-pointer hover:border-[var(--accent)]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {note && <p className="mt-3 mb-0 text-[12px] text-[var(--text-secondary)]">{note}</p>}

      {recommendation && (
        <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-white p-4 shadow-[var(--shadow-soft)]">
          <p className="m-0 text-[12px] uppercase tracking-[0.12em] text-[var(--accent)]">
            Ready to build
          </p>
          <h2 className="m-0 mt-1 text-[18px] font-semibold tracking-tight">
            {recommendation.title}
          </h2>
          <p className="mt-1 mb-0 text-[13px] text-[var(--text-secondary)]">
            {formatMinutes(recommendation.estimatedMinutes)} · {recommendation.background} ·{' '}
            {recommendation.unitIds.length} existing units
          </p>
          <button
            type="button"
            onClick={() => onComplete(recommendation)}
            className="mt-3 rounded-full border-0 bg-[var(--accent)] px-4 py-2.5 text-[14px] font-medium text-white cursor-pointer"
          >
            Build this path
          </button>
        </div>
      )}

      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void send(draft)
        }}
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          placeholder="Describe your background and what you want to learn"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void send(draft)
            }
          }}
          className="min-h-[52px] flex-1 resize-none rounded-2xl border border-[var(--border)] bg-white px-3.5 py-2.5 text-[14px] leading-relaxed outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={!draft.trim() || pending}
          aria-label="Send"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-0 bg-[var(--text)] text-white cursor-pointer disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}

function suggestionsFor(last: string): string[] {
  if (/gradient descent and basic neural networks/i.test(last)) {
    return [
      "Yes, but I don't understand Transformers.",
      'No, start from the beginning.',
    ]
  }
  if (/what should the path focus on/i.test(last)) {
    return ['Transformers', 'The physics of learning', 'Grokking and generalization']
  }
  if (/how much time do you have/i.test(last)) {
    return ['30 minutes', '2 hours', '1 day', '1 week']
  }
  if (/what do you want to learn/i.test(last) || /language model is not connected/i.test(last)) {
    return [EXAMPLE]
  }
  return []
}
