import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

interface Q { q: string; options: string[]; answer: string }
const DURATION = 30

export default function SpeedTrivia({ config, onComplete }: Props) {
  const questions: Q[] = (config.questions as Q[]) ?? []
  const [qi, setQi] = useState(0)
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<{ idx: number; correct: boolean } | null>(null)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const done = useRef(false)
  const scoreRef = useRef(0)
  const qStart = useRef(Date.now())

  const finish = useCallback((s: number) => {
    if (done.current) return
    done.current = true
    onComplete(s)
  }, [onComplete])

  useEffect(() => {
    if (timeLeft === 0) { finish(scoreRef.current); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, finish])

  const answer = (opt: string, idx: number) => {
    if (done.current || flash) return
    const q = questions[qi]
    const correct = opt === q.answer
    setFlash({ idx, correct })
    if (correct) {
      const elapsed = Date.now() - qStart.current
      const pts = Math.max(50, 200 - Math.floor(elapsed / 20))
      scoreRef.current += pts
      setScore(scoreRef.current)
    }
    setTimeout(() => {
      setFlash(null)
      qStart.current = Date.now()
      const next = qi + 1
      if (next >= questions.length) { finish(scoreRef.current); return }
      setQi(next)
    }, 600)
  }

  if (!questions.length) return <div className="min-h-screen flex items-center justify-center text-white/40">Loading…</div>

  if (qi >= questions.length) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <div className="text-7xl mb-4">🧩</div>
      <h2 className="text-3xl font-black text-green-400">Trivia Done!</h2>
      <p className="text-white/60 mt-2">Score: <span className="text-yellow-400 font-bold">{score}</span></p>
    </div>
  )

  const q = questions[qi]
  const pct = (timeLeft / DURATION) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <p className="text-center text-white/40 text-sm mb-4">Q{qi + 1} / {questions.length}</p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <p className="text-white font-bold text-xl text-center leading-snug">{q.q}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt, i) => {
            let cls = 'bg-white/10 hover:bg-white/20 text-white'
            if (flash?.idx === i) cls = flash.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            else if (flash && opt === q.answer) cls = 'bg-green-500/60 text-white'
            return (
              <button
                key={i}
                onPointerDown={() => answer(opt, i)}
                disabled={!!flash}
                className={`py-4 px-3 rounded-2xl font-bold text-sm transition active:scale-95 ${cls}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
