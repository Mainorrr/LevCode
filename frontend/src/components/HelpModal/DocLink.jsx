import { ExternalLink } from 'lucide-react'

export default function DocLink({ href, children }) {
  return (
    <a className="help-doclink" href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <ExternalLink size={13} />
    </a>
  )
}
