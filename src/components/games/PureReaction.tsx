import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

type Phase = 'wait' | 'go' | 'clicked' | 'cheated'

export default function PureReaction({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('wait')
  const [ms, setMs] = useState(0)
  const goTime = useRef<number>(0)
  const done = useRef(false)

  const finish = useCallback((score: number) => {
    if (done.current) return
    done.current = true
    onComplete(score)
  }, [onComplete])

  useEffect(() => {
    const delay = 1500 + Math.random() * 3500
    const t = setTimeout(() => {
      setPhase('go')
      goTime.current = performance.now()
    }, delay)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase === 'clicked' || phase === 'cheated') {
      const score = phase === 'cheated' ? 0 : Math.max(0, 1000 - Math.floor(ms / 2))
      const t = setTimeout(() => finish(score), 2000)
      return () => clearTimeout(t)
    }
  }, [phase, ms, finish])

  const handleClick = () => {
    if (done.current) return
    if (phase === 'wait') {
      setPhase('cheated')
    } else if (phase === 'go') {
      const elapsed = performance.now() - goTime.current
      setMs(Math.round(elapsed))
      setPhase('clicked')
    }
  }

  const bg =
    phase === 'go' ? 'bg-green-500' :
    phase === 'clicked' ? 'bg-blue-600' :
    phase === 'cheated' ? 'bg-red-600' :
    'bg-[#0f0f1a]'

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center cursor-pointer transition-colors duration-100 ${bg}`}
      onPointerDown={handleClick}
    >
      <div className="text-center select-none">
        {phase === 'wait' && (
          <>
            <div className="text-8xl mb-6">🎯</div>
            <p className="text-3xl font-black text-white/60">Wait for green…</p>
            <p className="text-white/30 text-sm mt-2">Don't click yet!</p>
          </>
        )}
        {phase === 'go' && (
          <>
            <div className="text-8xl mb-6 animate-bounce">⚡</div>
            <p className="text-5xl font-black">CLICK NOW!</p>
          </>
        )}
        {phase === 'clicked' && (
          <>
            <div className="text-8xl mb-4">✅</div>
            <p className="text-5xl font-black">{ms}ms</p>
            <p className="text-white/70 mt-2 text-xl">Score: {Math.max(0, 1000 - Math.floor(ms / 2))}</p>
          </>
        )}
        {phase === 'cheated' && (
          <>
            <div className="text-8xl mb-4 shake">🚨</div>
            <p className="text-3xl font-black">Too early! 0 points</p>
          </>
        )}
      </div>
    </div>
  )
}
