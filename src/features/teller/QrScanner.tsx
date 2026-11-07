import { useEffect, useRef, useState } from 'react'
import type { IScannerControls } from '@zxing/browser'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { Dialog, DialogActions } from '@/components/Dialog'
import { Spinner } from '@/components/Spinner'

// T9: read a customer card's QR (`BANKMINI:{account_number}`) with the webcam.
// The camera needs a secure context (https or localhost); over plain
// http://<LAN IP> the browser hides it, so the manual/USB field stays the fallback.

function cameraUnavailableReason(): string | null {
  if (!window.isSecureContext) {
    return 'Kamera hanya dapat dipakai jika aplikasi dibuka lewat https atau localhost. Gunakan scanner USB atau ketik nomor rekening.'
  }
  if (!navigator.mediaDevices?.getUserMedia) return 'Browser ini tidak mendukung akses kamera.'
  return null
}

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError') return 'Akses kamera ditolak. Izinkan kamera di pengaturan browser, lalu coba lagi.'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'Kamera tidak ditemukan.'
  if (name === 'NotReadableError') return 'Kamera sedang dipakai aplikasi lain.'
  return 'Kamera tidak dapat dibuka.'
}

function ScannerView({ onResult }: { onResult: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let controls: IScannerControls | null = null
    let cancelled = false
    let done = false

    async function start() {
      try {
        // Loaded on demand: the decoder is large and most counters use a USB scanner.
        const { BrowserQRCodeReader } = await import('@zxing/browser')
        if (cancelled || !videoRef.current) return
        controls = await new BrowserQRCodeReader().decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (!result || done) return
          done = true
          controls?.stop()
          onResult(result.getText())
        })
        if (cancelled) controls.stop()
        else setStatus('scanning')
      } catch (caught) {
        if (cancelled) return
        setError(cameraErrorMessage(caught))
        setStatus('error')
      }
    }

    void start()
    return () => {
      cancelled = true
      controls?.stop()
    }
  }, [onResult])

  if (status === 'error') return <Alert>{error}</Alert>
  return (
    <div className="relative overflow-hidden rounded-lg bg-ink-900">
      <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
      {status === 'starting' && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-white">
          <Spinner className="size-4" /> Membuka kamera…
        </div>
      )}
      <div className="pointer-events-none absolute inset-[15%] rounded-lg border-2 border-white/70" />
    </div>
  )
}

export function QrScannerButton({ onScan }: { onScan: (text: string) => void }) {
  const [open, setOpen] = useState(false)
  const unavailable = open ? cameraUnavailableReason() : null
  // Stable identity so the camera is not restarted on every render.
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan
  const [handleResult] = useState(() => (text: string) => {
    setOpen(false)
    onScanRef.current(text)
  })

  return (
    <>
      <Button variant="secondary" icon="scan" onClick={() => setOpen(true)}>
        Pindai kamera
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Pindai kartu nasabah"
        description="Arahkan QR pada kartu nasabah ke kamera. Nasabah langsung dicari setelah terbaca."
      >
        {unavailable ? <Alert tone="warning">{unavailable}</Alert> : <ScannerView onResult={handleResult} />}
        <DialogActions>
          <Button variant="secondary" data-autofocus onClick={() => setOpen(false)}>
            Ketik manual
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
