import type { ReactNode } from 'react'

interface SectionProps {
  title: ReactNode
  children: ReactNode
}

export function Section({ title, children }: SectionProps) {
  return (
    <section className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-2.5 text-[15px] font-semibold text-gray-900">
        {title}
      </h2>
      {children}
    </section>
  )
}
