import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

const SIZE = 16
const LIT_COUNT = 6

function makeTarget(): Set<number> {
  const s = new Set<number>()
  while (s.size < LIT_COUNT) s.add(Math.floor(Math.random() * SIZE))
  return s
}

type Phase = 'memorize' | 'recall' | 'done'

export default function MemoryGrid({ onComplete }: Props) {
  const [target] = useState(makeTarget)
  const [phase, setPhase] = useState<Phase>('memorize')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(3)
  const [revealed, setRevealed] = useState(false)
  const done = useRef(false)

  const finish = useCallback((s: number) => {
    if (done.current) return
    done.current = true
    onComplete(s)
  }, [onComplete])

  useEffect(() => {
    if (phase !== 'memorize') return
    if (timeLeft === 0) { setPhase('recall'); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, phase])

  useEffect(() => {
    if (phase !== 'recall') return
    const t = setTimeout(() => {
      setRevealed(true)
      const correct = [...selected].filter(i => target.has(i)).length
      const wrong = [...selected].filter(i => !target.has(i)).length
      const score = Math.max(0, correct * 120 - wrong * 60)
      setTimeout(() => finish(score), 2000)
    }, 20000)
    return () => clearTimeout(t)
  }, [phase, selected, target, finish])

  const toggle = (i: number) => {
    if (phase !== 'recall' || revealed || done.current) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else if (next.size < LIT_COUNT) next.add(i)
      return next
    })
  }

  const submit = () => {
    if (phase !== 'recall' || revealed) return
    setRevealed(true)
    const correct = [...selected].filter(i => target.has(i)).length
    const wrong = [...selected].filter(i => !target.has(i)).length
    const score = Math.max(0, correct * 120 - wrong * 60)
    setTimeout(() => finish(score), 1500)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs">
        <div className="text-center mb-4">
          {phase === 'memorize' && (
            <p className="text-yellow-400 font-bold">Memorize! ({timeLeft}s)</p>
          )}
          {phase === 'recall' && !revealed && (
            <p className="text-white/60">Click the {LIT_COUNT} tiles you remember ({selected.size}/{LIT_COUNT})</p>
          )}
          {revealed && (
            <p className="text-green-400 font-bold">
              {[...selected].filter(i => target.has(i)).length}/{LIT_COUNT} correct!
            </p>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {Array.from({ length: SIZE }, (_, i) => {
            const isTarget = target.has(i)
            const isSel = selected.has(i)
            let cls = 'bg-white/5 border border-white/10'
            if (phase === 'memorize' && isTarget) cls = 'bg-purple-400 shadow-lg shadow-purple-400/50'
            if (phase === 'recall' && !revealed) {
              if (isSel) cls = 'bg-blue-400 shadow-lg shadow-blue-400/50'
              else cls = 'bg-white/5 border border-white/10 hover:bg-white/10'
            }
            if (revealed) {
              if (isTarget && isSel) cls = 'bg-green-500'
              else if (isTarget) cls = 'bg-green-500/40 border-2 border-green-400'
              else if (isSel) cls = 'bg-red-500'
              else cls = 'bg-white/5'
            }
            return (
              <button
                key={i}
                onPointerDown={() => toggle(i)}
                className={`aspect-square rounded-xl transition-all ${cls} ${phase === 'recall' && !revealed ? 'active:scale-90' : ''}`}
              />
            )
          })}
        </div>

        {phase === 'recall' && !revealed && (
          <button
            onClick={submit}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-black rounded-xl active:scale-95 transition"
          >
            Submit Answer
          </button>
        )}
      </div>
    </div>
  )
}
