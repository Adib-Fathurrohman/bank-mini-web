import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import type { AuditTransaction } from '@/api/types'
import { useCurrentUser } from '@/auth/context'
import { Alert } from '@/components/Alert'
import { Amount } from '@/components/Amount'
import { Badge } from '@/components/Badge'
import { DataList, DataRow } from '@/components/DataList'
import { Icon } from '@/components/Icon'
import { Eyebrow, PageHeader, Panel } from '@/components/Page'
import { LoadError, Loading } from '@/components/QueryStatus'
import { formatDateTime } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { cashDirection } from '@/features/teller/labels'
import { ACCOUNT_LABEL } from './labels'
import { useAuditTransaction } from './queries'

function TxLink({ id, children }: { id: number; children: ReactNode }) {
  return (
    <Link to={`/audit/transactions/${id}`} className="font-medium text-brand-700 hover:underline">
      {children}
    </Link>
  )
}

/** How the customer authorized a withdrawal: in the app (Mode A) or with the PIN at the counter (Mode B). */
function approval(t: AuditTransaction): string | null {
  if (t.type !== 'withdrawal') return null
  if (t.withdrawal_authorization) return `Disetujui nasabah via aplikasi · ${formatDateTime(t.withdrawal_authorization.approved_at)}`
  return 'PIN nasabah di loket'
}

/** The double entry behind one transaction: one debit and one credit of the same amount. */
function JournalPanel({ transaction }: { transaction: AuditTransaction }) {
  const lines = transaction.journals ?? []
  const debit = lines.filter((l) => l.position === 'debit').reduce((sum, l) => sum + l.amount, 0)
  const credit = lines.filter((l) => l.position === 'credit').reduce((sum, l) => sum + l.amount, 0)
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-4 py-3">
        <h2 className="text-[15px] font-semibold text-ink-900">Jurnal</h2>
        {lines.length > 0 && <Badge tone={debit === credit ? 'success' : 'danger'}>{debit === credit ? 'Seimbang' : 'Tidak seimbang'}</Badge>}
      </div>
      {lines.length === 0 ? (
        <p className="px-4 py-4 text-sm text-ink-500">Tidak ada baris jurnal.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-50 text-left text-xs text-ink-500">
              <th scope="col" className="py-2 pr-3 pl-4 font-medium">
                Akun
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">
                Debit
              </th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">
                Kredit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {/* Debit first, as in a journal entry. */}
            {[...lines]
              .sort((a, b) => (a.position === b.position ? 0 : a.position === 'debit' ? -1 : 1))
              .map((l) => (
                <tr key={l.id}>
                  <td className={`py-2.5 pr-3 text-ink-900 ${l.position === 'credit' ? 'pl-7' : 'pl-4'}`}>
                    {ACCOUNT_LABEL[l.account_code] ?? `${l.account_code} · ${l.account_name}`}
                  </td>
                  <td className="py-2.5 pr-3 text-right">{l.position === 'debit' ? formatRupiah(l.amount) : ''}</td>
                  <td className="py-2.5 pr-4 text-right">{l.position === 'credit' ? formatRupiah(l.amount) : ''}</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-ink-200 font-semibold">
              <th scope="row" className="py-2.5 pr-3 pl-4 text-left">
                Total
              </th>
              <td className="py-2.5 pr-3 text-right">{formatRupiah(debit)}</td>
              <td className="py-2.5 pr-4 text-right">{formatRupiah(credit)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </Panel>
  )
}

/** One transaction from the audit trail: balances, who did it, correction links, app approval and journal. */
export function AuditTransactionPage() {
  const id = Number(useParams().id)
  const user = useCurrentUser()
  const query = useAuditTransaction(id)

  const back = (
    <Link
      to="/audit/transactions"
      className="mb-1 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-ink-900"
    >
      <Icon name="chevronLeft" className="size-3.5" />
      Log audit
    </Link>
  )

  if (query.isPending) return <Loading />
  if (query.error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={`Transaksi #${id}`} back={back} />
        {query.error.kind === 'notFound' ? (
          <Alert title="Transaksi tidak ditemukan" />
        ) : (
          <LoadError error={query.error} onRetry={() => void query.refetch()} />
        )}
      </div>
    )
  }

  const t = query.data
  const direction = cashDirection(t.type)
  const isCorrection = t.corrects_transaction_id !== null
  const approvedBy = approval(t)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={back}
        title={`${t.type_label} #${t.id}`}
        meta={
          <>
            {isCorrection && <Badge tone="warning">Koreksi</Badge>}
            {t.corrected_by && <Badge tone="warning">Dikoreksi</Badge>}
          </>
        }
        description={formatDateTime(t.created_at)}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Panel className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-col gap-1">
            <Eyebrow>Nominal</Eyebrow>
            <Amount
              value={direction === 'in' ? t.amount : -t.amount}
              sign
              size="xl"
              tone={t.corrected_by ? 'muted' : direction === 'in' ? 'in' : 'default'}
              className={t.corrected_by ? 'line-through decoration-ink-400' : ''}
            />
            <p className="text-[13px] text-ink-500 first-letter:uppercase">{t.amount_in_words}</p>
          </div>
          <DataList>
            <DataRow label="Nasabah">
              <Link to={`/customers/${t.customer.id}`} className="font-medium text-brand-700 hover:underline">
                {t.customer.full_name}
              </Link>
            </DataRow>
            <DataRow label="Rekening" mono>
              {t.customer.account_number}
            </DataRow>
            <DataRow label="Teller">{t.teller?.full_name ?? '—'}</DataRow>
            <DataRow label="Saldo sebelum">{formatRupiah(t.balance_before)}</DataRow>
            <DataRow label="Saldo sesudah" strong>
              {formatRupiah(t.balance_after)}
            </DataRow>
            {approvedBy && <DataRow label="Persetujuan">{approvedBy}</DataRow>}
            <DataRow label="Shift">
              {user.role === 'supervisor' ? (
                <Link to={`/supervisor/reports/${t.daily_report_id}`} className="font-medium text-brand-700 hover:underline">
                  Laporan harian #{t.daily_report_id}
                </Link>
              ) : (
                <>Laporan harian #{t.daily_report_id}</>
              )}
            </DataRow>
            {isCorrection && (
              <DataRow label="Membatalkan">
                <TxLink id={t.corrects_transaction_id!}>Transaksi #{t.corrects_transaction_id}</TxLink>
              </DataRow>
            )}
            {t.authorized_by && <DataRow label="Otorisasi supervisor">{t.authorized_by.full_name}</DataRow>}
            {t.note && <DataRow label="Alasan">“{t.note}”</DataRow>}
            {t.corrected_by && (
              <DataRow label="Dibatalkan oleh">
                <TxLink id={t.corrected_by.id}>Transaksi #{t.corrected_by.id}</TxLink> · {formatDateTime(t.corrected_by.created_at)}
              </DataRow>
            )}
          </DataList>
        </Panel>

        <JournalPanel transaction={t} />
      </div>
    </div>
  )
}
