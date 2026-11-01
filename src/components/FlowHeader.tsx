import { Link } from 'react-router-dom'
import { BrandMark } from './BrandMark'

export function FlowHeader({
  backTo = '/',
  backLabel = 'Search',
}: {
  backTo?: string
  backLabel?: string
}) {
  return (
    <header className="flex items-center justify-between px-6 sm:px-10 py-5">
      <BrandMark compact />
      <Link className="nav-link" to={backTo}>
        {backLabel}
      </Link>
    </header>
  )
}
