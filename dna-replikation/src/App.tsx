import { LazyMotion, domAnimation, m } from 'framer-motion'
import DNAReplication from './components/DNAReplication'

export default function App() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-10 backdrop-blur bg-slate-50/70 border-b border-slate-200">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <m.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold tracking-tight text-slate-900">
              Interaktive DNA‑Replikation
            </m.h1>
            <a href="#modell" className="text-sm text-slate-600 hover:text-slate-900">Zum Modell</a>
          </div>
        </header>

        <main>
          <section className="mx-auto max-w-3xl px-6 py-12">
            <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg leading-7">
              Diese Seite erklärt die DNA‑Replikation modellhaft. Scrolle, um die Phasen zu steuern: Entwindung, Synthese am Leit‑ und Folgestrang und Verknüpfung der Okazaki‑Fragmente.
            </m.p>
          </section>

          <section id="modell" className="relative">
            <DNAReplication />
          </section>
        </main>

        <footer className="border-t border-slate-200 mt-16">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-600">
            Modellhafte Visualisierung. Farben angelehnt an Vorlage: A blau, T violett, C grün, G orange; Zucker‑Phosphat‑Rückgrat rot.
          </div>
        </footer>
      </div>
    </LazyMotion>
  )
}


