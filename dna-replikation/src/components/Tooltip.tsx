import { PropsWithChildren, useEffect, useRef, useState } from 'react'

type TooltipProps = PropsWithChildren<{
  label: string
  text: string
  x?: number
  y?: number
}>

export default function Tooltip({ label, text, children, x, y }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const groupRef = useRef<SVGGElement | null>(null)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const TOOLTIP_WIDTH = 260
  const TOOLTIP_HEIGHT = 120

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

  const measure = () => {
    const g = groupRef.current
    if (!g) return
    const svg = g.ownerSVGElement
    const vb = svg?.viewBox?.baseVal
    const vbWidth = vb?.width ?? 1200
    const vbHeight = vb?.height ?? 620

    if (typeof x === 'number' && typeof y === 'number') {
      const tx = clamp(x + 12, 0, vbWidth - TOOLTIP_WIDTH)
      const ty = clamp(y - TOOLTIP_HEIGHT / 2, 0, vbHeight - TOOLTIP_HEIGHT)
      setPos({ x: tx, y: ty })
      return
    }

    try {
      const bbox = g.getBBox()
      const tx = clamp(bbox.x + bbox.width + 8, 0, vbWidth - TOOLTIP_WIDTH)
      const ty = clamp(bbox.y + bbox.height / 2 - TOOLTIP_HEIGHT / 2, 0, vbHeight - TOOLTIP_HEIGHT)
      setPos({ x: tx, y: ty })
    } catch {
      // ignore measurement errors
    }
  }

  useEffect(() => {
    if (open) measure()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (open) measure()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, y])

  return (
    <g
      ref={groupRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onMouseMove={() => {
        if (open) measure()
      }}
    >
      {children}
      {open && (
        <foreignObject x={pos.x} y={pos.y} width={TOOLTIP_WIDTH} height={TOOLTIP_HEIGHT} pointerEvents="none">
          <div className="pointer-events-none select-none rounded-lg border border-slate-200 bg-white p-3 shadow-md">
            <div className="text-xs font-semibold text-slate-900">{label}</div>
            <div className="mt-1 text-xs leading-5 text-slate-700">{text}</div>
          </div>
        </foreignObject>
      )}
    </g>
  )
}


