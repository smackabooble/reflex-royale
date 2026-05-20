import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

interface Balloon { id: number; x: number; y: number; speed: number; color: string; popped: boolean }

const COLORS = ['🎈','🎀','🫧','🟣','🟡','🔴','🟠','🟢']
const DURATION = 20
let bid = 0

export default function BalloonPop({ onComplete }: Props) {
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [pops, setPops] = useState<{ id: number; x: number; y: number }[]>([])
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
    const id = setInterval(() => {
      setBalloons(prev => {
        const filtered = prev.filter(b => !b.popped && b.y > -80)
        const moved = filtered.map(b => ({ ...b, y: b.y - b.speed }))
        if (moved.length < 8 && Math.random() > 0.3) {
          moved.push({
            id: bid++,
            x: 5 + Math.random() * 80,
            y: 105,
            speed: 0.8 + Math.random() * 1.5,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            popped: false,
          })
        }
        return moved
      })
    }, 50)
    return () => clearInterval(id)
  }, [timeLeft])

  const pop = (balloon: Balloon) => {
    if (done.current || balloon.popped) return
    setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, popped: true } : b))
    const s = scoreRef.current + 100
    scoreRef.current = s
    setScore(s)
    setPops(prev => [...prev.slice(-8), { id: balloon.id, x: balloon.x, y: balloon.y }])
    setTimeout(() => setPops(prev => prev.filter(p => p.id !== balloon.id)), 800)
  }

  const pct = (timeLeft / DURATION) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none overflow-hidden">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-400 to-purple-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <div className="relative bg-gradient-to-b from-blue-900/20 to-purple-900/20 border border-white/10 rounded-2xl overflow-hidden" style={{ height: 420 }}>
          {balloons.map(b => (
            <button
              key={b.id}
              onPointerDown={() => pop(b)}
              style={{ left: `${b.x}%`, top: `${b.y}%`, position: 'absolute', transform: 'translate(-50%, -50%)' }}
              className={`text-4xl transition-all ${b.popped ? 'scale-150 opacity-0' : 'hover:scale-110 active:scale-90'}`}
            >
              {b.color}
            </button>
          ))}
          {pops.map(p => (
            <div
              key={p.id}
              className="score-popup absolute text-yellow-400 font-black text-lg pointer-events-none"
              style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%,-50%)' }}
            >
              +100
            </div>
          ))}
        </div>

        <p className="text-center text-white/30 text-sm mt-3">Pop the balloons!</p>
      </div>
    </div>
  )
}
