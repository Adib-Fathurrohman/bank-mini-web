import { Link } from 'react-router'
import { buttonClass } from '@/components/Button'
import { FullPageStatus } from '@/components/FullPageStatus'

export function NotFoundPage() {
  return (
    <FullPageStatus title="Halaman tidak ditemukan" description="Alamat yang Anda buka tidak tersedia.">
      <Link to="/" className={buttonClass()}>
        Kembali ke beranda
      </Link>
    </FullPageStatus>
  )
}
