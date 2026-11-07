import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import type { CustomerCard } from '@/api/types'
import { Alert } from '@/components/Alert'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { PageHeader } from '@/components/Page'
import { LoadError, Loading } from '@/components/QueryStatus'
import { useCustomerCard } from './queries'

/** The QR the teller scans, drawn as SVG from `qr_payload` (no image request, prints sharply). */
function QrCode({ payload, size }: { payload: string; size: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let cancelled = false
    // Loaded on demand, like the teller's scanner, so the library stays out of the main bundle.
    void import('@zxing/browser').then(({ BrowserQRCodeSvgWriter }) => {
      const host = ref.current
      if (cancelled || !host) return
      const svg = new BrowserQRCodeSvgWriter().write(payload, size, size)
      svg.setAttribute('role', 'img')
      svg.setAttribute('aria-label', `Kode QR ${payload}`)
      host.replaceChildren(svg)
    })
    return () => {
      cancelled = true
    }
  }, [payload, size])
  return <div ref={ref} className="shrink-0 bg-white" style={{ width: size, height: size }} />
}

/** ID-1 card size (85.6 × 54 mm), so it prints at real size. */
function Card({ card }: { card: CustomerCard }) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-[3mm] border border-ink-300 bg-white text-ink-900 shadow-pop print:shadow-none"
      style={{ width: '85.6mm', height: '54mm' }}
    >
      <div className="flex items-center gap-2 bg-brand-800 px-[4mm] py-[2mm] text-white print:[print-color-adjust:exact]">
        <BrandMark className="size-5" />
        <span className="text-[9pt] leading-tight font-semibold">
          Bank Mini Sekolah
          <span className="block text-[6.5pt] font-normal text-brand-100">Kartu Nasabah · E-Teller</span>
        </span>
      </div>
      <div className="flex flex-1 items-center gap-[3mm] px-[4mm] py-[2.5mm]">
        <QrCode payload={card.qr_payload} size={104} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[10pt] font-semibold">{card.full_name}</p>
          <p className="mt-[1mm] font-mono text-[9pt]">{card.account_number}</p>
          <p className="mt-[1.5mm] text-[7pt] text-ink-600">NIS {card.nis}</p>
          <p className="text-[7pt] text-ink-600">
            {card.class} {card.major.code} {card.group}
          </p>
          <p className="mt-[1mm] text-[6.5pt] text-ink-500">{card.major.major_name}</p>
        </div>
      </div>
    </div>
  )
}

/** Print preview of one customer card; the browser prints only the card. */
export function CustomerCardPage() {
  const id = Number(useParams().id)
  const query = useCustomerCard(id)

  const back = (
    <Link
      to={`/customers/${id}`}
      className="mb-1 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-ink-900"
    >
      <Icon name="chevronLeft" className="size-3.5" />
      Detail nasabah
    </Link>
  )

  if (query.isPending) return <Loading />
  if (query.error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Kartu nasabah" back={back} />
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      </div>
    )
  }

  const card = query.data
  return (
    <div className="flex flex-col gap-6">
      <div className="print:hidden">
        <PageHeader
          back={back}
          title="Kartu nasabah"
          description="Teller memindai QR ini untuk mencari rekening. Ukuran cetak 85,6 × 54 mm."
          actions={
            <Button icon="printer" onClick={() => window.print()}>
              Cetak kartu
            </Button>
          }
        />
      </div>
      {card.account_status !== 'active' && (
        <div className="print:hidden">
          <Alert tone="warning" title="Rekening tidak aktif">
            Kartu tetap dapat dicetak, tetapi transaksi di loket ditolak selama rekening ditangguhkan.
          </Alert>
        </div>
      )}
      <div className="flex justify-center rounded-lg border border-dashed border-ink-300 bg-ink-50 p-6 sm:p-10 print:border-0 print:bg-white print:p-0">
        <Card card={card} />
      </div>
    </div>
  )
}
