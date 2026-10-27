import { Link } from 'react-router'
import { FullPageStatus } from '@/components/FullPageStatus'

export function NotFoundPage() {
  return (
    <FullPageStatus title="Halaman tidak ditemukan" description="Alamat yang Anda buka tidak tersedia.">
      <Link to="/" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
        Kembali ke beranda
      </Link>
    </FullPageStatus>
  )
}
