import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

const DURATION = 10

export default function RapidTap({ onComplete }: Props) {
  const [taps, setTaps] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [started, setStarted] = useState(false)
  const done = useRef(false)
  const tapsRef = useRef(0)

  const finish = useCallback((s: number) => {
    if (done.current) return
    done.current = true
    onComplete(s * 20)
  }, [onComplete])

  useEffect(() => {
    if (!started) return
    if (timeLeft === 0) { finish(tapsRef.current); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, started, finish])

  const tap = () => {
    if (done.current) return
    if (!started) setStarted(true)
    tapsRef.current++
    setTaps(tapsRef.current)
  }

  const pct = (timeLeft / DURATION) * 100
  const urgency = timeLeft <= 3 ? 'from-red-500 to-orange-500' : timeLeft <= 6 ? 'from-yellow-400 to-orange-500' : 'from-green-400 to-cyan-500'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs text-center">
        <div className="flex items-center justify-between mb-6">
          <div className="text-3xl font-black text-yellow-400">{taps}</div>
          <div className="flex-1 mx-4 h-3 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${urgency} transition-all duration-1000`} style={{ width: `${started ? pct : 100}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <button
          onPointerDown={tap}
          className="w-48 h-48 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 active:scale-90 transition-all shadow-2xl shadow-orange-500/40 flex flex-col items-center justify-center mx-auto"
        >
          <span className="text-6xl">👆</span>
          <span className="text-black font-black text-lg mt-2">{started ? 'TAP!' : 'START!'}</span>
        </button>

        <p className="text-white/30 text-sm mt-6">
          {started ? `${taps} taps · keep going!` : 'Tap as fast as you can for 10 seconds!'}
        </p>
      </div>
    </div>
  )
}
