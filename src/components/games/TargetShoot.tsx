import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string; players: Player[]; onSend: (msg: object) => void
}

interface Target { id: number; x: number; y: number; size: number; born: number; ttl: number }
const DURATION = 15
let uid = 0

export default function TargetShoot({ onComplete }: Props) {
  const [targets, setTargets] = useState<Target[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [misses, setMisses] = useState(0)
  const done = useRef(false)
  const scoreRef = useRef(0)
  const missRef = useRef(0)

  const finish = useCallback((s: number) => { if (done.current) return; done.current = true; onComplete(s) }, [onComplete])

  useEffect(() => {
    if (timeLeft === 0) { finish(scoreRef.current); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, finish])

  useEffect(() => {
    if (done.current) return
    const interval = setInterval(() => {
      const ttl = 1200 + Math.random() * 1200
      setTargets(prev => {
        const filtered = prev.filter(t => Date.now() - t.born < t.ttl)
        const expired = prev.filter(t => Date.now() - t.born >= t.ttl)
        if (expired.length) {
          missRef.current += expired.length
          setMisses(missRef.current)
        }
        return [...filtered, { id: uid++, x: 5 + Math.random() * 85, y: 10 + Math.random() * 75, size: 40 + Math.random() * 30, born: Date.now(), ttl }]
      })
    }, 700)
    return () => clearInterval(interval)
  }, [])

  const hit = (id: number, size: number) => {
    if (done.current) return
    const pts = Math.round(200 - size * 2)
    scoreRef.current += pts
    setScore(scoreRef.current)
    setTargets(prev => prev.filter(t => t.id !== id))
  }

  const pct = (timeLeft / DURATION) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-400 to-orange-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>
        <p className="text-center text-white/30 text-xs mb-2">Misses: {misses}</p>

        <div className="relative w-full rounded-2xl bg-white/5 border border-white/10 overflow-hidden" style={{ height: 340 }}>
          {targets.map(t => {
            const age = Date.now() - t.born
            const shrink = Math.max(0.2, 1 - age / t.ttl)
            return (
              <button key={t.id}
                onPointerDown={() => hit(t.id, t.size)}
                className="absolute rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/50 flex items-center justify-center text-white font-black active:scale-90 transition-transform"
                style={{ left: `${t.x}%`, top: `${t.y}%`, width: t.size * shrink, height: t.size * shrink, transform: `translate(-50%,-50%) scale(${shrink})`, fontSize: t.size * shrink * 0.4 }}
              >
                🎯
              </button>
            )
          })}
        </div>
        <p className="text-center text-white/30 text-xs mt-3">Hit targets before they disappear! Smaller = more points</p>
      </div>
    </div>
  )
}
