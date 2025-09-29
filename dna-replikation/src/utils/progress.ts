export function subProgress(value: number, start: number, end: number): number {
  if (end === start) return 0
  const t = (value - start) / (end - start)
  if (t < 0) return 0
  if (t > 1) return 1
  return t
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}


