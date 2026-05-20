import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

const GRID = 16
const DURATION = 15

export default function WhackMole({ onComplete }: Props) {
  const [holes, setHoles] = useState<boolean[]>(Array(GRID).fill(false))
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [hits, setHits] = useState<number[]>([])
  const done = useRef(false)
  const scoreRef = useRef(0)

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

  useEffect(() => {
    if (timeLeft === 0) return
    const speed = Math.max(350, 900 - (DURATION - timeLeft) * 40)
    const id = setInterval(() => {
      setHoles(() => {
        const next = Array(GRID).fill(false)
        const count = timeLeft < 5 ? 3 : timeLeft < 10 ? 2 : 1
        const used = new Set<number>()
        while (used.size < count) used.add(Math.floor(Math.random() * GRID))
        used.forEach(i => { next[i] = true })
        return next
      })
    }, speed)
    return () => clearInterval(id)
  }, [timeLeft])

  const whack = (i: number) => {
    if (!holes[i] || done.current) return
    setHoles(prev => { const n = [...prev]; n[i] = false; return n })
    const s = scoreRef.current + 100
    scoreRef.current = s
    setScore(s)
    setHits(prev => [...prev.slice(-5), i])
  }

  const pct = (timeLeft / DURATION) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-3xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {holes.map((active, i) => (
            <button
              key={i}
              onPointerDown={() => whack(i)}
              className={`aspect-square rounded-2xl text-4xl flex items-center justify-center transition-all ${
                active
                  ? 'bg-green-500 shadow-lg shadow-green-500/50 scale-105 cursor-pointer'
                  : 'bg-white/5 cursor-default'
              } ${hits.includes(i) ? 'pop' : ''}`}
            >
              {active ? '🐹' : ''}
            </button>
          ))}
        </div>

        <p className="text-center text-white/30 text-sm mt-4">Tap the moles!</p>
      </div>
    </div>
  )
}
