import type { ReactNode } from 'react'
import { BrandLockup } from '@/components/BrandMark'

/** The centred card of the public pages (login, forgot and reset password). */
export function AuthCard({ title, description, children, footer }: { title: string; description?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          <BrandLockup subtitle="E-Teller · Staf" />
          <div>
            <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
            {description && <p className="mt-1 text-sm text-ink-600">{description}</p>}
          </div>
        </div>
        {children}
        {footer && <div className="mt-5 text-center text-[13px] leading-relaxed text-ink-500">{footer}</div>}
      </div>
    </main>
  )
}
