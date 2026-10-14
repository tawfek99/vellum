/** Formats a byte count (e.g. 2411724 -> "2.3 MB"). */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  const rounded = index === 0 || value >= 10 ? Math.round(value) : Number(value.toFixed(1))
  return `${rounded} ${units[index]}`
}
