import { DEFAULT_LOGO, DEFAULT_SYSTEM_NAME } from '@/lib/constants'

function normalizeBrandValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export function applyDocumentTitleToDom(systemName: unknown): void {
  if (typeof document === 'undefined') return
  const name = normalizeBrandValue(systemName, DEFAULT_SYSTEM_NAME)
  document.title = name
  const metaTitle =
    document.querySelector<HTMLMetaElement>('meta[name="title"]')
  metaTitle?.setAttribute('content', name)
}

export function applyFaviconToDom(url: unknown): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  try {
    const next = new URL(
      normalizeBrandValue(url, DEFAULT_LOGO),
      window.location.href
    ).href
    const existing =
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')
    if (existing.length === 1 && existing[0].href === next) return
    const link = document.createElement('link')
    link.rel = 'icon'
    link.href = next
    existing.forEach((l) => l.remove())
    document.head.appendChild(link)
  } catch {
    // Ignore malformed URLs
  }
}

export function applySystemBrandingToDom(
  systemName: unknown,
  logo: unknown
): void {
  applyDocumentTitleToDom(systemName)
  applyFaviconToDom(logo)
}
