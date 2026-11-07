// PDFs come from authenticated endpoints, so they are fetched as blobs
// (`requestBlob`) and handed to the browser here. File names are chosen by the
// client because a cross-origin app cannot read Content-Disposition (L4).

/** Opens a PDF in a new tab for viewing/printing; falls back to a download if pop-ups are blocked. */
export function openPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  // Not 'noopener': with it window.open() always returns null and we could not detect a blocked pop-up.
  const opened = window.open(url, '_blank')
  if (opened) opened.opener = null
  else savePdf(blob, filename)
  // Give the new tab time to load the object URL before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function savePdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
