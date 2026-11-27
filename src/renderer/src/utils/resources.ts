export function isVideoFilename(value: string): boolean {
  // eslint-disable-next-line no-control-regex -- Reject control characters in imported filenames.
  return /^[^<>:"/\\|?*\x00-\x1f]+\.(mp4|webm|mov|m4v|ogv)$/i.test(value)
}

export function getCategoryOptions(items: { category: string }[]): {
  value: string
  label: string
}[] {
  return [
    { value: 'all', label: 'All categories' },
    ...Array.from(new Set(items.map((item) => item.category))).map((category) => ({
      value: category,
      label: category
    }))
  ]
}

export function isWebsite(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

export function videoSource(filename: string): string | undefined {
  if (!isVideoFilename(filename)) return undefined
  return `app-video://local/${encodeURIComponent(filename)}`
}
