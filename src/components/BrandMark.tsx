import { Link } from 'react-router-dom'

export function BrandMark({
  compact = false,
  wordmark = false,
}: {
  compact?: boolean
  wordmark?: boolean
}) {
  if (wordmark) {
    return (
      <Link
        to="/"
        className="no-underline text-[var(--text)] text-center tracking-tight"
      >
        <span className="block text-center text-[34px] font-semibold leading-tight sm:text-[38px]">
          Learning AI like learning physics
        </span>
      </Link>
    )
  }

  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-2.5 no-underline text-[var(--text)]"
    >
      <span
        className={`
          relative inline-flex items-center justify-center rounded-full
          border border-[var(--border)] bg-white
          shadow-[var(--shadow-soft)]
          ${compact ? 'h-8 w-8' : 'h-10 w-10'}
        `}
        aria-hidden
      >
        <span
          className={`absolute rounded-full border-2 border-[var(--accent)] opacity-80 ${
            compact ? 'h-4 w-4' : 'h-5 w-5'
          }`}
        />
        <span
          className={`absolute rounded-full border border-[var(--accent)] opacity-40 ${
            compact ? 'h-6 w-6' : 'h-7 w-7'
          }`}
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`font-semibold tracking-tight ${
            compact ? 'text-[15px]' : 'text-[18px]'
          }`}
        >
          MetaCircle
          <span className="ml-1.5 font-normal text-[var(--text-secondary)]">
            Explore
          </span>
        </span>
        {!compact && (
          <span className="mt-1 text-[12px] text-[var(--text-tertiary)] tracking-wide">
            Knowledge you can experiment with
          </span>
        )}
      </span>
    </Link>
  )
}
