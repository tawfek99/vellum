/** Deterministic, subtle tilt (±1.2°) so paper cards read like loose sheets. */
export function tiltFor(id: string): number {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) | 0
  }
  return ((Math.abs(hash) % 5) - 2) * 0.6
}
