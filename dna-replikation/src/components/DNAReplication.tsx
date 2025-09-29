import { m, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import Tooltip from './Tooltip'
import facts from '../data/facts'
import { easeInOutQuad } from '../utils/progress'

export default function DNAReplication() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 20, mass: 0.3 })

  // Vier klar getrennte Stadien – je Stadium ein vollflächiges Bild mit Crossfade
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
  const fadeWindow = (v: number, start: number, end: number) => {
    const m = 0.06
    if (v < start - m || v > end + m) return 0
    if (v < start) return easeInOutQuad(clamp01((v - (start - m)) / m))
    if (v > end) return 1 - easeInOutQuad(clamp01((v - end) / m))
    return 1
  }

  const stage1Opacity = useTransform(smooth, v => fadeWindow(v, 0.00, 0.22))
  const stage2Opacity = useTransform(smooth, v => fadeWindow(v, 0.25, 0.47))
  const stage3Opacity = useTransform(smooth, v => fadeWindow(v, 0.50, 0.72))
  const stage4Opacity = useTransform(smooth, v => fadeWindow(v, 0.75, 0.98))

  // Progress je Stadium
  const s2Progress = useTransform(smooth, [0.25, 0.47], [0, 1])
  const s3Progress = useTransform(smooth, [0.50, 0.72], [0, 1])
  const s4Progress = useTransform(smooth, [0.75, 0.98], [0, 1])

  // Stadium-Parameter
  const forkX = useTransform(s2Progress, [0, 1], [360, 920])
  const splitSep = useTransform(s2Progress, [0, 1], [0, 140])
  const s3Sep = useTransform(s3Progress, [0, 1], [120, 200])
  const s3RevealWidth = useTransform(s3Progress, [0, 1], [0, 1040])
  const s4Twist = s4Progress
  const s3PolyX = useTransform(s3Progress, [0, 1], [120, 960])

  // Drehung/Entdrillung – im Stadium 2 aktiv
  const unwinding = useTransform(s2Progress, [0, 1], [0, 1])
  const [rotation, setRotation] = useState(0)
  useMotionValueEvent(unwinding, 'change', (v) => {
    setRotation(360 * easeInOutQuad(v))
  })
  const unwindRotation = useTransform(unwinding, v => 360 * v)

  // Stärke der sichtbaren „Verdrehung“ der Sprossen (1 am Anfang → 0 entdrillt)
  const twistFactor = 1 - Math.min(1, Math.max(0, rotation / 360))

  const basePairs = useMemo(() => {
    const pairs: Array<{
      x: number;
      colorLeft: string;
      colorRight: string;
      baseL: string;
      baseR: string;
    }> = []
    const palette = [
      { l: 'A', r: 'T', cl: '#8AD1E3', cr: '#B296FF' },
      { l: 'C', r: 'G', cl: '#B6E388', cr: '#F9A23B' },
      { l: 'T', r: 'A', cl: '#B296FF', cr: '#8AD1E3' },
      { l: 'G', r: 'C', cl: '#F9A23B', cr: '#B6E388' },
    ]
    for (let i = 0; i < 28; i++) {
      const p = palette[i % palette.length]
      pairs.push({ x: i, colorLeft: p.cl, colorRight: p.cr, baseL: p.l, baseR: p.r })
    }
    return pairs
  }, [])

  // Geometrie der Helix (2D-Projektion)
  const xStart = 80
  const xEnd = 1120
  const yCenterTop = 180
  const yCenterBottom = 440
  const amplitude = 38
  const periods = 2
  const segments = 120
  const tValues = Array.from({ length: segments }, (_, i) => i / (segments - 1))
  const pointsTop = tValues.map(t => {
    const x = xStart + t * (xEnd - xStart)
    const phase = 2 * Math.PI * (t * periods)
    const y = yCenterTop + Math.sin(phase) * amplitude
    return { x, y, phase, t }
  })
  const pointsBottom = tValues.map(t => {
    const x = xStart + t * (xEnd - xStart)
    const phase = 2 * Math.PI * (t * periods)
    const y = yCenterBottom - Math.sin(phase) * amplitude
    return { x, y, phase, t }
  })
  const pathTop = `M${pointsTop.map(p => `${p.x},${p.y}`).join(' L ')}`
  const pathBottom = `M${pointsBottom.map(p => `${p.x},${p.y}`).join(' L ')}`

  return (
    <div ref={containerRef} className="relative mx-auto max-w-6xl px-6 py-16 min-h-[340vh]">
      <div className="sticky top-20">
        <div className="grid grid-cols-1 gap-8">
          <div className="relative h-[620px] rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <svg viewBox="0 0 1200 620" className="w-full h-full">
              <defs>
                <linearGradient id="backbone" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ff718f" />
                  <stop offset="100%" stopColor="#e24b6a" />
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="primer" x1="0" x2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fde68a" />
                </linearGradient>

                {/* Bereiche für Doppelhelix (links) und Einzelstränge (rechts) */}
                <clipPath id="double-clip">
                  <m.rect x={0} y={0} height={620} style={{ width: forkX }} />
                </clipPath>
                <clipPath id="right-clip">
                  <m.rect y={0} height={620} style={{ x: forkX, width: 1200 }} />
                </clipPath>
              {/* keine zusätzlichen Reveals mehr – Stadium 3 baut direkt vom Gabelpunkt aus auf */}
              </defs>

              {/* STADIUM 1: eingedrehte Doppelhelix */}
              <m.g style={{ opacity: stage1Opacity }}>
                <path d={pathTop} stroke="url(#backbone)" strokeWidth="8" fill="none"/>
                <path d={pathBottom} stroke="url(#backbone)" strokeWidth="8" fill="none"/>
                {basePairs.map((p, idx) => {
                  const t = idx / (basePairs.length - 1)
                  const pt = pointsTop[Math.min(pointsTop.length - 1, Math.round(t * (pointsTop.length - 1)))]
                  const pb = pointsBottom[Math.min(pointsBottom.length - 1, Math.round(t * (pointsBottom.length - 1)))]
                  const cx = pt.x
                  const cy = (pt.y + pb.y) / 2
                  const height = Math.max(16, Math.abs(pb.y - pt.y) - 14)
                  const tilt = 35 * Math.sin(pt.phase)
                  return (
                    <g key={`s1-${idx}`} transform={`rotate(${tilt}, ${cx}, ${cy})`}>
                      <rect x={cx - 2} y={cy - height / 2} width={4} height={height} fill="#e2e8f0" />
                      <rect x={cx - 18} y={pt.y - 10} width={20} height={20} rx={6} fill={p.colorLeft} />
                      <rect x={cx - 2} y={pb.y - 10} width={20} height={20} rx={6} fill={p.colorRight} />
                    </g>
                  )
                })}
              </m.g>

              {/* STADIUM 2: Entwindung und Trennung an der Gabel */}
              <m.g style={{ opacity: stage2Opacity }}>
                {/* linke Seite weiterhin Helix, rechts getrennte Stränge */}
                <g>
                  <path d={pathTop} stroke="url(#backbone)" strokeWidth="8" fill="none"/>
                  <path d={pathBottom} stroke="url(#backbone)" strokeWidth="8" fill="none"/>
                  {basePairs.map((p, idx) => {
                    const t = idx / (basePairs.length - 1)
                    const pt = pointsTop[Math.min(pointsTop.length - 1, Math.round(t * (pointsTop.length - 1)))]
                    const pb = pointsBottom[Math.min(pointsBottom.length - 1, Math.round(t * (pointsBottom.length - 1)))]
                    const cx = pt.x
                    const cy = (pt.y + pb.y) / 2
                    const height = Math.max(16, Math.abs(pb.y - pt.y) - 14)
                    const fork = (forkX as any).get()
                    const nearFork = Math.max(0, 1 - Math.abs(cx - fork) / 240)
                    // Wasserstoffbrücke schrumpft von der Gabel aus
                    const bridgeScale = 1 - nearFork
                    // Basensprossen richten sich zur Gabel hin aus
                    const tilt = (8 + 27 * (1 - nearFork)) * Math.sin(pt.phase)
                    return (
                      <g key={`s2-${idx}`} transform={`rotate(${tilt}, ${cx}, ${cy})`}>
                        <rect x={cx - 2} y={cy - (height * (0.25 + 0.75 * bridgeScale)) / 2} width={4} height={height * (0.25 + 0.75 * bridgeScale)} fill="#e2e8f0" />
                        <rect x={cx - 18} y={pt.y - 10} width={20} height={20} rx={6} fill={p.colorLeft} />
                        <rect x={cx - 2} y={pb.y - 10} width={20} height={20} rx={6} fill={p.colorRight} />
                      </g>
                    )
                  })}
                </g>
                {/* rechte Seite ab Gabel: getrennte Stränge mit Abstand */}
                <g>
                  {basePairs.map((p, idx) => {
                    const x = 100 + idx * 38
                    const fork = (forkX as any).get()
                    if (x < fork) return null
                    // Aus der Gabel heraus „ziehen“ sich die Stränge auseinander
                    const baseOffset = Math.min(1, Math.max(0, (x - fork) / 220))
                    const sep = (splitSep as any).get() * baseOffset
                    const yTop = 200 - (idx % 6) * 10 - sep
                    const yBottom = 320 + (idx % 6) * 10 + sep
                    return (
                      <g key={`s2split-${idx}`}>
                        <rect x={x - 12} y={yTop - 18} width={24} height={36} rx={6} fill={p.colorLeft} />
                        <rect x={x - 12} y={yBottom - 18} width={24} height={36} rx={6} fill={p.colorRight} />
                      </g>
                    )
                  })}
                </g>
              <Tooltip label="Topoisomerase" text={facts.Topoisomerase} x={250} y={110}>
                <m.circle cx={250} cy={110} r="28" className="fill-slate-500" style={{ rotate: unwindRotation }} />
              </Tooltip>
                <Tooltip label="Helikase" text={facts.Helikase}>
                  <m.polygon points="0,0 40,50 -40,50" className="fill-sky-400" style={{ x: forkX, y: 210 }} />
              </Tooltip>
                <m.g style={{ opacity: useTransform(s2Progress, [0.2, 0.8], [0, 1]) }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Tooltip key={i} label="SSB/RPA" text={facts.RPA_SSB}>
                      <m.circle cx={(forkX as any).get() + 40 + i*28} cy={300 + (i%2)*26} r="7" className="fill-cyan-400" />
                  </Tooltip>
                ))}
                </m.g>
              </m.g>

              {/* STADIUM 3: deutlich getrennte Stränge, komplementäre Basen ergänzen (vom Gabelpunkt aus) */}
              <m.g style={{ opacity: stage3Opacity }}>
                {basePairs.map((p, idx) => {
                  const x = 100 + idx * 38
                  const fork = (forkX as any).get()
                  const distFromFork = Math.max(0, x - fork)
                  const grow = Math.min(1, distFromFork / 900) // wächst nach rechts
                  const yTop = 200 - (idx % 6) * 10 - (s3Sep as any).get()
                  const yBottom = 320 + (idx % 6) * 10 + (s3Sep as any).get()
                  return (
                    <g key={`s3-${idx}`}>
                      {/* Vorlage-Stränge */}
                      <rect x={x - 12} y={yTop - 18} width={24} height={36} rx={6} fill={p.colorLeft} />
                      <rect x={x - 12} y={yBottom - 18} width={24} height={36} rx={6} fill={p.colorRight} />
                      {/* komplementäre Basen wachsen vom Gabelpunkt aus (Skalierung von 0→1) */}
                      <g transform={`translate(${x},${yTop}) scale(${grow}) translate(${-x},${-yTop})`}>
                        <rect x={x + 6} y={yTop - 16} width={20} height={32} rx={6} fill={p.colorRight} />
                      </g>
                      <g transform={`translate(${x},${yBottom}) scale(${grow}) translate(${-x},${-yBottom})`}>
                        <rect x={x + 6} y={yBottom - 16} width={20} height={32} rx={6} fill={p.colorLeft} />
                      </g>
                    </g>
                  )
                })}
                {/* Polymerasen wandern synchron von links nach rechts */}
                <Tooltip label="DNA‑Polymerase" text={facts.DNA_Polymerase}>
                  <m.rect y={140 - (s3Sep as any).get()} width="120" height="36" rx="18" className="fill-slate-700" style={{ x: s3PolyX }} />
                </Tooltip>
                <Tooltip label="DNA‑Polymerase" text={facts.DNA_Polymerase}>
                  <m.rect y={460 + (s3Sep as any).get()} width="120" height="36" rx="18" className="fill-slate-700" style={{ x: s3PolyX }} />
              </Tooltip>
                <Tooltip label="Primase / RNA‑Primer" text={facts.Primase}>
                  <m.rect width="80" height="16" rx="8" fill="url(#primer)" style={{ x: s3PolyX, y: 340, opacity: 0.8 }} />
                </Tooltip>
              </m.g>

              {/* STADIUM 4: fertige Doppelhelices drehen sich ein */}
              <m.g style={{ opacity: stage4Opacity }}>
                {[-80, 80].map((yShift, k) => (
                  <g key={k}>
                    <path d={pathTop} transform={`translate(0, ${yShift})`} stroke="url(#backbone)" strokeWidth="8" fill="none"/>
                    <path d={pathBottom} transform={`translate(0, ${yShift})`} stroke="url(#backbone)" strokeWidth="8" fill="none"/>
                    {basePairs.map((p, idx) => {
                      const t = idx / (basePairs.length - 1)
                      const pt = pointsTop[Math.min(pointsTop.length - 1, Math.round(t * (pointsTop.length - 1)))]
                      const pb = pointsBottom[Math.min(pointsBottom.length - 1, Math.round(t * (pointsBottom.length - 1)))]
                      const cx = pt.x
                      const cy = (pt.y + pb.y) / 2 + yShift
                      const height = Math.max(16, Math.abs(pb.y - pt.y) - 14)
                      const tilt = (10 + 25 * (s4Twist as any).get()) * Math.sin(pt.phase)
                      return (
                        <g key={`s4-${k}-${idx}`} transform={`rotate(${tilt}, ${cx}, ${cy})`}>
                          <rect x={cx - 2} y={cy - height / 2} width={4} height={height} fill="#e2e8f0" />
                          <rect x={cx - 18} y={pt.y - 10 + yShift} width={20} height={20} rx={6} fill={p.colorLeft} />
                          <rect x={cx - 2} y={pb.y - 10 + yShift} width={20} height={20} rx={6} fill={p.colorRight} />
                        </g>
                      )
                    })}
                  </g>
                ))}
                <Tooltip label="DNA‑Ligase" text={facts.Ligase} x={340} y={360}>
                  <m.rect x={320} y={340} width="60" height="28" rx="14" className="fill-rose-400" />
                </Tooltip>
              </m.g>

              

              {/* Legende */}
              <g>
                <rect x="40" y="24" width="220" height="116" rx="12" className="fill-white" stroke="#e2e8f0" />
                {[
                  ['Adenin', '#8AD1E3'],
                  ['Thymin', '#B296FF'],
                  ['Cytosin', '#B6E388'],
                  ['Guanin', '#F9A23B'],
                ].map((it, i) => (
                  <g key={i}>
                    <rect x={56} y={40 + i*24} width="20" height="14" rx="4" fill={it[1]} />
                    <text x={84} y={52 + i*24} fontSize="12" fill="#0f172a">{it[0]}</text>
                  </g>
                ))}
              </g>
            </svg>
          </div>

          <div className="px-2 text-slate-700 text-sm">
            <strong>Scroll‑Steuerung:</strong> {" "}
            Frühphase: Entdrillung durch Topoisomerase und Öffnung der Gabel durch Helikase. Mittelphase: Leit‑/Folgestrang‑Synthese mit Primern, Okazaki‑Fragmenten und SSB/RPA. Spätphase: Ligation der Fragmente.
          </div>
        </div>
      </div>
    </div>
  )
}


