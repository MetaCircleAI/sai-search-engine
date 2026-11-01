import { Search, X } from 'lucide-react'
import { useEffect, useId, useRef, type FormEvent, type KeyboardEvent } from 'react'
import type { KnowledgeUnit } from '../knowledge/registry'

type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  suggestions?: KnowledgeUnit[]
  onPickSuggestion?: (unit: KnowledgeUnit) => void
  autoFocus?: boolean
  large?: boolean
  placeholder?: string
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  suggestions = [],
  onPickSuggestion,
  autoFocus,
  large,
  placeholder = 'Search concepts, phenomena, experiments…',
}: Props) {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const showSuggest = value.trim().length > 0 && suggestions.length > 0

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    onSubmit(value.trim())
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onChange('')
      inputRef.current?.blur()
    }
  }

  return (
    <form onSubmit={submit} className="relative w-full">
      <div
        className={`
          flex items-center gap-3 w-full bg-white border border-[var(--border)]
          shadow-[var(--shadow-soft)] transition-[border-color,box-shadow]
          focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-soft)]
          ${large ? 'rounded-full px-6 py-4' : 'rounded-2xl px-4 py-2.5'}
        `}
      >
        {!large && (
          <Search
            className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]"
            strokeWidth={1.75}
          />
        )}
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={showSuggest}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={placeholder}
          className={`
            flex-1 min-w-0 bg-transparent border-0 outline-none
            text-[var(--text)] placeholder:text-[var(--text-tertiary)]
            ${large ? 'text-[19px] sm:text-[22px]' : 'text-[15px]'}
          `}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
            className="shrink-0 p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--border-subtle)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {large && (
          <Search
            className="h-6 w-6 shrink-0 text-[var(--text-tertiary)]"
            strokeWidth={1.75}
          />
        )}
      </div>

      {showSuggest && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]"
        >
          {suggestions.map((unit) => (
            <li key={unit.id} role="option">
              <button
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-[var(--bg)] transition-colors border-b border-[var(--border-subtle)] last:border-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPickSuggestion?.(unit)}
              >
                <div className={`font-medium text-[var(--text)] ${large ? 'text-[17px]' : 'text-[14px]'}`}>
                  {unit.title}
                </div>
                <div className={`mt-0.5 text-[var(--text-secondary)] line-clamp-1 ${large ? 'text-[15px]' : 'text-[12px]'}`}>
                  {unit.category} · {unit.description}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
