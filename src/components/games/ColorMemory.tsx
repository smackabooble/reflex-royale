import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string; players: Player[]; onSend: (msg: object) => void
}

const COLORS = ['#ef4444','#3b82f6','#22c55e','#eab308','#a855f7','#f97316']
const NAMES = ['Red','Blue','Green','Yellow','Purple','Orange']
const ROUNDS = 4
const DURATION = 40

function makeSequence(len: number) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * COLORS.length))
}

export default function ColorMemory({ onComplete }: Props) {
  const [round, setRound] = useState(0)
  const [sequence] = useState(() => Array.from({ length: ROUNDS }, (_, i) => makeSequence(3 + i)))
  const [phase, setPhase] = useState<'show' | 'recall'>('show')
  const [showIdx, setShowIdx] = useState(0)
  const [answer, setAnswer] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [flash, setFlash] = useState<number | null>(null)
  const done = useRef(false)
  const scoreRef = useRef(0)

  const finish = useCallback((s: number) => { if (done.current) return; done.current = true; onComplete(s) }, [onComplete])

  useEffect(() => {
    if (timeLeft === 0) { finish(scoreRef.current); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, finish])

  useEffect(() => {
    setPhase('show'); setShowIdx(0); setAnswer([])
    const seq = sequence[round]
    let i = 0
    const interval = setInterval(() => {
      setFlash(seq[i])
      setTimeout(() => setFlash(null), 600)
      i++
      if (i >= seq.length) { clearInterval(interval); setTimeout(() => setPhase('recall'), 700) }
    }, 900)
    return () => clearInterval(interval)
  }, [round])

  const pick = (ci: number) => {
    if (done.current || phase !== 'recall') return
    const seq = sequence[round]
    const next = [...answer, ci]
    setAnswer(next)
    setFlash(ci); setTimeout(() => setFlash(null), 300)
    if (next.length === seq.length) {
      const correct = next.filter((v, i) => v === seq[i]).length
      const pts = correct * 100
      scoreRef.current += pts; setScore(scoreRef.current)
      setTimeout(() => {
        const nextRound = round + 1
        if (nextRound >= ROUNDS) { finish(scoreRef.current); return }
        setRound(nextRound)
      }, 800)
    }
  }

  const pct = (timeLeft / DURATION) * 100
  const seq = sequence[round]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs text-center">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-400 to-violet-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <p className="text-white/40 text-sm mb-3">Round {round + 1} / {ROUNDS} · Sequence of {seq.length}</p>

        <div className="flex justify-center gap-2 mb-6 h-10">
          {phase === 'show'
            ? <p className="text-yellow-400 font-bold">Watch the sequence! 👀</p>
            : <p className="text-white/60">Repeat the sequence! ({answer.length}/{seq.length})</p>
          }
        </div>

        {phase === 'show' && flash !== null && (
          <div className="w-24 h-24 rounded-2xl mx-auto mb-6 transition-all" style={{ backgroundColor: COLORS[flash], boxShadow: `0 0 30px ${COLORS[flash]}80` }} />
        )}
        {phase === 'show' && flash === null && <div className="w-24 h-24 rounded-2xl mx-auto mb-6 bg-white/5" />}
        {phase === 'recall' && (
          <div className="flex gap-2 justify-center mb-6">
            {answer.map((ci, i) => (
              <div key={i} className="w-8 h-8 rounded-lg" style={{ backgroundColor: COLORS[ci] }} />
            ))}
            {Array(seq.length - answer.length).fill(0).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-lg bg-white/10 border border-dashed border-white/20" />
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {COLORS.map((c, i) => (
            <button key={i} onPointerDown={() => pick(i)} disabled={phase !== 'recall'}
              className="h-14 rounded-2xl transition-all active:scale-90 disabled:opacity-40"
              style={{ backgroundColor: c, boxShadow: flash === i ? `0 0 20px ${c}` : 'none' }}>
              <span className="font-bold text-white/80 text-xs">{NAMES[i]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
