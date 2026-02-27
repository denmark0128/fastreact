import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  extra?: ReactNode
}

function PageHeader({ title, subtitle, extra }: PageHeaderProps) {
  return (
    <div className="mb-5 flex w-full items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {extra}
    </div>
  )
}

export default PageHeader
