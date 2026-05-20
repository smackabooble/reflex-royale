import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

const COLORS = ['red', 'blue', 'green', 'yellow'] as const
type Color = typeof COLORS[number]
const DURATION = 18

const BG: Record<Color, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
}

function makeGrid(): Color[] {
  return Array.from({ length: 16 }, () => COLORS[Math.floor(Math.random() * 4)])
}

export default function ColorTap({ onComplete }: Props) {
  const [target, setTarget] = useState<Color>(() => COLORS[Math.floor(Math.random() * 4)])
  const [grid, setGrid] = useState<Color[]>(makeGrid)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [flash, setFlash] = useState<number | null>(null)
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

  const tap = (i: number, color: Color) => {
    if (done.current) return
    setFlash(i)
    setTimeout(() => setFlash(null), 200)
    if (color === target) {
      scoreRef.current += 80
      setScore(scoreRef.current)
      const next = [...grid]
      next[i] = COLORS[Math.floor(Math.random() * 4)]
      setGrid(next)
      if (next.every(c => c !== target)) {
        setGrid(makeGrid())
        setTarget(COLORS[Math.floor(Math.random() * 4)])
      }
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 30)
      setScore(scoreRef.current)
    }
  }

  const pct = (timeLeft / DURATION) * 100
  const TARGET_BORDER: Record<Color, string> = {
    red: 'border-red-500 text-red-400',
    blue: 'border-blue-500 text-blue-400',
    green: 'border-green-500 text-green-400',
    yellow: 'border-yellow-400 text-yellow-400',
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <div className={`text-center mb-5 py-3 border-2 rounded-2xl ${TARGET_BORDER[target]}`}>
          <p className="text-sm text-white/50 mb-1">Tap only</p>
          <p className="text-2xl font-black uppercase">{target}</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {grid.map((color, i) => (
            <button
              key={i}
              onPointerDown={() => tap(i, color)}
              className={`aspect-square rounded-2xl transition-all active:scale-90 shadow-lg ${BG[color]} ${flash === i ? 'scale-110' : ''}`}
            />
          ))}
        </div>
        <p className="text-center text-white/30 text-sm mt-4">Tap {target} circles · -30 for wrong!</p>
      </div>
    </div>
  )
}
