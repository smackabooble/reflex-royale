import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

const COUNT = 15

function makePositions() {
  return Array.from({ length: COUNT }, (_, i) => ({
    num: i + 1,
    x: 5 + Math.random() * 80,
    y: 5 + Math.random() * 80,
  }))
}

export default function NumberRush({ onComplete }: Props) {
  const [positions] = useState(makePositions)
  const [next, setNext] = useState(1)
  const [done2, setDone2] = useState(false)
  const start = useRef(Date.now())
  const done = useRef(false)

  const finish = useCallback((score: number) => {
    if (done.current) return
    done.current = true
    onComplete(score)
  }, [onComplete])

  useEffect(() => {
    const t = setTimeout(() => { if (!done.current) finish(0) }, 30000)
    return () => clearTimeout(t)
  }, [finish])

  const click = (num: number) => {
    if (done.current || num !== next) return
    if (num === COUNT) {
      const elapsed = Date.now() - start.current
      const score = Math.max(0, Math.floor(10000 - elapsed / 3))
      setDone2(true)
      finish(score)
    } else {
      setNext(num + 1)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="relative w-full max-w-sm" style={{ height: '70vw', maxHeight: 400 }}>
        <div className="absolute inset-0 bg-white/3 rounded-3xl border border-white/10">
          {positions.map(({ num, x, y }) => {
            const isNext = num === next
            const isPast = num < next
            return (
              <button
                key={num}
                onPointerDown={() => click(num)}
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                className={`absolute w-12 h-12 rounded-full font-black text-lg transition-all
                  ${isPast ? 'bg-white/10 text-white/20 scale-75' : ''}
                  ${isNext ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/60 scale-110 animate-pulse-fast' : ''}
                  ${!isPast && !isNext ? 'bg-white/20 text-white/60 hover:bg-white/30' : ''}
                `}
              >
                {num}
              </button>
            )
          })}
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-white/40 text-sm">
          {done2 ? '🎉 Done!' : `Click: ${next} → ${COUNT}`}
        </p>
      </div>
    </div>
  )
}
