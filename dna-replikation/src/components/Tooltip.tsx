import { PropsWithChildren, useEffect, useId, useRef, useState } from 'react'
import { useDeviceCapabilities } from '../utils/device'

type TooltipProps = PropsWithChildren<{
  label: string
  text: string
  x?: number
  y?: number
  delay?: number
  ariaLabel?: string
}>

export default function Tooltip({ label, text, children, x, y, delay = 120, ariaLabel }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const groupRef = useRef<SVGGElement | null>(null)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const enterTimer = useRef<number | null>(null)
  const leaveTimer = useRef<number | null>(null)
  const tooltipId = useId()
  const { canHover, isTouchLike } = useDeviceCapabilities()

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
      className="group outline-none"
      role="group"
      aria-haspopup="true"
      aria-expanded={open}
      aria-describedby={open ? tooltipId : undefined}
      aria-label={ariaLabel ?? label}
      tabIndex={0}
      style={{ cursor: 'help', filter: open ? 'url(#glow)' as any : undefined }}
      onMouseEnter={canHover ? () => {
        if (leaveTimer.current) {
          window.clearTimeout(leaveTimer.current)
          leaveTimer.current = null
        }
        if (enterTimer.current) window.clearTimeout(enterTimer.current)
        enterTimer.current = window.setTimeout(() => setOpen(true), delay)
      } : undefined}
      onMouseLeave={canHover ? () => {
        if (enterTimer.current) {
          window.clearTimeout(enterTimer.current)
          enterTimer.current = null
        }
        if (leaveTimer.current) window.clearTimeout(leaveTimer.current)
        leaveTimer.current = window.setTimeout(() => setOpen(false), 60)
      } : undefined}
      onMouseMove={canHover ? () => {
        if (open) measure()
      } : undefined}
      onPointerEnter={!canHover ? undefined : undefined}
      onPointerLeave={!canHover ? undefined : undefined}
      onPointerUp={isTouchLike ? () => setOpen(o => !o) : undefined}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
      onClick={isTouchLike ? undefined : () => setOpen(o => !o)}
    >
      {children}
      {open && (
        <foreignObject x={pos.x} y={pos.y} width={TOOLTIP_WIDTH} height={TOOLTIP_HEIGHT} pointerEvents="none">
          <div
            id={tooltipId}
            role="tooltip"
            aria-hidden={!open}
            className="pointer-events-none select-none rounded-lg border border-slate-200 bg-white p-3 shadow-md"
          >
            <div className="text-xs font-semibold text-slate-900">{label}</div>
            <div className="mt-1 text-xs leading-5 text-slate-700">{text}</div>
          </div>
        </foreignObject>
      )}
    </g>
  )
}


