import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

const DURATION_MS = 5500
const TARGET = 80 // percent

export default function TheWire({ onComplete }: Props) {
  const [pct, setPct] = useState(0)
  const [clicked, setClicked] = useState<number | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const startRef = useRef(Date.now())
  const rafRef = useRef<number>(0)
  const done = useRef(false)

  const finish = useCallback((s: number) => {
    if (done.current) return
    done.current = true
    onComplete(s)
  }, [onComplete])

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startRef.current
      const p = Math.min(100, (elapsed / DURATION_MS) * 100)
      setPct(p)
      if (p >= 100) {
        // Missed completely
        setClicked(100)
        setScore(0)
        setTimeout(() => finish(0), 1800)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [finish])

  const handleClick = () => {
    if (done.current || clicked !== null) return
    cancelAnimationFrame(rafRef.current)
    const elapsed = Date.now() - startRef.current
    const p = Math.min(100, (elapsed / DURATION_MS) * 100)
    const dist = Math.abs(p - TARGET)
    const s = Math.max(0, Math.round(1000 - dist * 18))
    setClicked(p)
    setScore(s)
    setTimeout(() => finish(s), 2000)
  }

  const dist = clicked !== null ? Math.abs(clicked - TARGET).toFixed(1) : null

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 cursor-pointer select-none"
      onPointerDown={handleClick}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-white/40 text-sm mb-1">Stop the bar at the target!</p>
          <p className="text-yellow-400 font-bold text-sm">Target: {TARGET}%</p>
        </div>

        <div className="relative h-16 bg-white/10 rounded-2xl overflow-hidden border border-white/20 mb-6">
          {/* Target zone */}
          <div
            className="absolute top-0 bottom-0 bg-yellow-400/20 border-x-2 border-yellow-400"
            style={{ left: `${TARGET - 5}%`, width: '10%' }}
          />
          {/* Target line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
            style={{ left: `${TARGET}%` }}
          />
          {/* Moving bar */}
          <div
            className={`absolute top-0 bottom-0 transition-none rounded-r-xl ${clicked !== null ? (score! > 700 ? 'bg-green-500' : score! > 300 ? 'bg-yellow-500' : 'bg-red-500') : 'bg-white/80'}`}
            style={{ width: `${clicked !== null ? clicked : pct}%` }}
          />
          {/* Click marker */}
          {clicked !== null && (
            <div className="absolute top-0 bottom-0 w-1 bg-white" style={{ left: `${clicked}%` }} />
          )}
        </div>

        {clicked !== null && score !== null ? (
          <div className="text-center slide-up">
            <p className="text-4xl font-black mb-2" style={{ color: score > 700 ? '#4ade80' : score > 300 ? '#facc15' : '#f87171' }}>
              {score} pts
            </p>
            <p className="text-white/40 text-sm">{dist}% off target</p>
          </div>
        ) : (
          <p className="text-center text-white/50 text-lg font-bold animate-pulse">
            Tap to stop!
          </p>
        )}
      </div>
    </div>
  )
}
