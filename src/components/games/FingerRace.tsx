import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string; players: Player[]; onSend: (msg: object) => void
}

const DURATION = 12

export default function FingerRace({ onComplete }: Props) {
  const [count, setCount] = useState(0)
  const [next, setNext] = useState<'L' | 'R'>('L')
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [started, setStarted] = useState(false)
  const [wrong, setWrong] = useState(false)
  const done = useRef(false)
  const countRef = useRef(0)
  const nextRef = useRef<'L' | 'R'>('L')

  const finish = useCallback((c: number) => { if (done.current) return; done.current = true; onComplete(c * 30) }, [onComplete])

  useEffect(() => {
    if (!started) return
    if (timeLeft === 0) { finish(countRef.current); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, started, finish])

  const tap = (side: 'L' | 'R') => {
    if (done.current) return
    if (!started) setStarted(true)
    if (side === nextRef.current) {
      countRef.current++; setCount(countRef.current)
      const n: 'L' | 'R' = side === 'L' ? 'R' : 'L'
      nextRef.current = n; setNext(n)
    } else {
      setWrong(true); setTimeout(() => setWrong(false), 300)
    }
  }

  const pct = (timeLeft / DURATION) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-between mb-6">
          <div className="text-3xl font-black text-yellow-400">{count}</div>
          <div className="flex-1 mx-4 h-3 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 bg-gradient-to-r ${timeLeft <= 3 ? 'from-red-500 to-orange-500' : 'from-green-400 to-cyan-500'}`} style={{ width: `${started ? pct : 100}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <p className="text-white/40 text-sm mb-4">{started ? `Alternating taps: ${count}` : 'Alternate left → right → left → right…'}</p>

        <div className={`text-center mb-4 text-lg font-bold transition-colors ${wrong ? 'text-red-400' : 'text-white/30'}`}>
          {wrong ? 'Wrong side! ❌' : `Tap ${next === 'L' ? 'LEFT ←' : 'RIGHT →'} next`}
        </div>

        <div className="flex gap-4">
          <button onPointerDown={() => tap('L')}
            className={`flex-1 h-40 rounded-2xl text-3xl font-black transition-all active:scale-95 ${next === 'L' && started ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/40' : 'bg-white/10 text-white/40'}`}>
            👈 L
          </button>
          <button onPointerDown={() => tap('R')}
            className={`flex-1 h-40 rounded-2xl text-3xl font-black transition-all active:scale-95 ${next === 'R' && started ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/40' : 'bg-white/10 text-white/40'}`}>
            R 👉
          </button>
        </div>
        <p className="text-white/30 text-xs mt-4">Alternate L and R as fast as possible!</p>
      </div>
    </div>
  )
}
