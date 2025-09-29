import { m, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import Tooltip from './Tooltip'
import facts from '../data/facts'
import { easeInOutQuad } from '../utils/progress'

type Scene = 'early' | 'middle' | 'late'

export default function DNAReplication() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 20, mass: 0.3 })

  const scene = useTransform(smooth, [0, 0.33, 0.66], ['early', 'middle', 'late'] as Scene[])

  const helixSeparation = useTransform(smooth, [0, 0.35], [0, 110])
  const helixSepTop = useTransform(helixSeparation, v => -v / 2)
  const helixSepBottom = useTransform(helixSeparation, v => v / 2)
  const forkOpen = useTransform(smooth, [0.05, 0.4], [0, 120])
  const forkX = useTransform(smooth, [0.05, 0.4], [360, 920])
  const okasakiOpacity = useTransform(smooth, [0.35, 0.7], [0, 1])
  const ligationGlow = useTransform(smooth, [0.65, 0.95], [0, 1])
  const ligationFilter = useTransform(ligationGlow, v => (v > 0.5 ? 'url(#glow)' : 'none'))

  // Drehung/Entdrillung der Doppelhelix (Topoisomerase-Effekt)
  const unwinding = useTransform(smooth, [0, 0.3], [0, 1])
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
              </defs>

              {/* Linke Seite: klare Doppelhelix mit geneigten Sprossen */}
              <g clipPath="url(#double-clip)">
                <path d={pathTop} stroke="url(#backbone)" strokeWidth="8" fill="none"/>
                <path d={pathBottom} stroke="url(#backbone)" strokeWidth="8" fill="none"/>
                {basePairs.map((p, idx) => {
                  const t = idx / (basePairs.length - 1)
                  const pt = pointsTop[Math.min(pointsTop.length - 1, Math.round(t * (pointsTop.length - 1)))]
                  const pb = pointsBottom[Math.min(pointsBottom.length - 1, Math.round(t * (pointsBottom.length - 1)))]
                  const cx = pt.x
                  const cy = (pt.y + pb.y) / 2
                  const height = Math.max(16, Math.abs(pb.y - pt.y) - 14)
                  const tilt = twistFactor * 35 * Math.sin(pt.phase)
                  return (
                    <g key={idx} transform={`rotate(${tilt}, ${cx}, ${cy})`}>
                      <rect x={cx - 2} y={cy - height / 2} width={4} height={height} fill="#e2e8f0" />
                      {/* Basen links/rechts (an den Rückgraten) */}
                      <rect x={cx - 18} y={pt.y - 10} width={20} height={20} rx={6} fill={p.colorLeft} />
                      <rect x={cx - 2} y={pb.y - 10} width={20} height={20} rx={6} fill={p.colorRight} />
                    </g>
                  )
                })}
              </g>

              {/* Rechte Seite: geöffnete Einzelstränge mit Basen (folgen dem Auseinanderziehen) */}
              <m.g clipPath="url(#right-clip)" style={{ y: helixSepTop }}>
                {basePairs.map((p, idx) => {
                  const x = 100 + idx * 38
                  const y = 200 - (idx % 6) * 10
                  return <rect key={`t-${idx}`} x={x - 12} y={y - 18} width="24" height="36" rx="6" fill={p.colorLeft} />
                })}
              </m.g>
              <m.g clipPath="url(#right-clip)" style={{ y: helixSepBottom }}>
                {basePairs.map((p, idx) => {
                  const x = 100 + idx * 38
                  const y = 320 + (idx % 6) * 10
                  return <rect key={`b-${idx}`} x={x - 12} y={y - 18} width="24" height="36" rx="6" fill={p.colorRight} />
                })}
              </m.g>

              {/* Topoisomerase (Entdrillung) */}
              <Tooltip label="Topoisomerase" text={facts.Topoisomerase} x={250} y={110}>
                <m.circle cx={250} cy={110} r="28" className="fill-slate-500" style={{ rotate: unwindRotation }} />
              </Tooltip>

              {/* Helikase als Keil, der die Gabel öffnet */}
              <Tooltip label="Helikase" text={facts.Helikase} x={560} y={230}>
                <m.polygon points="560,210 600,260 520,260" className="fill-sky-400" style={{ x: forkOpen }} />
              </Tooltip>

              {/* DNA-Polymerase am Leitstrang */}
              <Tooltip label="DNA‑Polymerase" text={facts.DNA_Polymerase} x={680} y={150}>
                <m.rect x={620} y={120} width="120" height="36" rx="18" className="fill-slate-700" />
              </Tooltip>

              {/* RNA‑Primer (Folgestrang) und Primase */}
              <Tooltip label="Primase / RNA‑Primer" text={facts.Primase} x={720} y={360}>
                <m.rect x={700} y={340} width="80" height="16" rx="8" fill="url(#primer)" style={{ opacity: okasakiOpacity }} />
              </Tooltip>

              {/* Okazaki‑Fragmente */}
              <m.g style={{ opacity: okasakiOpacity }}>
                {[0,1,2].map(i => (
                  <Tooltip key={i} label="Okazaki‑Fragment" text={facts.Okazaki} x={880 - i*180} y={370}>
                    <m.rect x={820 - i*180} y={350} width="120" height="24" rx="8" className="fill-slate-500" />
                  </Tooltip>
                ))}
              </m.g>

              {/* Ligase Glühen in Spätphase */}
              <Tooltip label="DNA‑Ligase" text={facts.Ligase} x={340} y={360}>
                <m.rect x={320} y={340} width="60" height="28" rx="14" className="fill-rose-400" style={{ filter: ligationFilter }} />
              </Tooltip>

              {/* SSB/RPA an Einzelsträngen nahe der Gabel */}
              <m.g style={{ opacity: useTransform(smooth, [0.18, 0.45], [0, 1]) }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Tooltip key={i} label="SSB/RPA" text={facts.RPA_SSB}>
                    <m.circle cx={760 + i*40} cy={300 + (i%2)*30} r="8" className="fill-cyan-400" />
                  </Tooltip>
                ))}
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


