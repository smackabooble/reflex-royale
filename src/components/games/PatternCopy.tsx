import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

const SIZE = 5
const ROUNDS = 3
const DURATION = 35
const SHOW_MS = 2500

function makePattern(seed: number, round: number) {
  let s = seed + round * 997
  const cells: boolean[] = []
  for (let i = 0; i < SIZE * SIZE; i++) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    cells.push((s >>> 1) % 3 === 0)
  }
  return cells
}

export default function PatternCopy({ config, onComplete }: Props) {
  const seed = (config.seed as number) ?? 12345
  const [round, setRound] = useState(0)
  const [phase, setPhase] = useState<'show' | 'copy'>('show')
  const [pattern] = useState(() => makePattern(seed, 0))
  const [patterns] = useState(() => Array.from({ length: ROUNDS }, (_, i) => makePattern(seed, i)))
  const [answer, setAnswer] = useState<boolean[]>(Array(SIZE * SIZE).fill(false))
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [showLeft, setShowLeft] = useState(SHOW_MS / 1000)
  const done = useRef(false)
  const scoreRef = useRef(0)
  const phaseRef = useRef<'show' | 'copy'>('show')

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
    phaseRef.current = 'show'
    setPhase('show')
    setAnswer(Array(SIZE * SIZE).fill(false))
    const t = setTimeout(() => { setPhase('copy'); phaseRef.current = 'copy' }, SHOW_MS)
    return () => clearTimeout(t)
  }, [round])

  const toggle = (i: number) => {
    if (done.current || phase !== 'copy') return
    setAnswer(prev => { const n = [...prev]; n[i] = !n[i]; return n })
  }

  const submit = () => {
    if (done.current) return
    const pat = patterns[round]
    const correct = answer.filter((v, i) => v === pat[i]).length
    const pts = correct * 40
    scoreRef.current += pts
    setScore(scoreRef.current)
    const next = round + 1
    if (next >= ROUNDS) { finish(scoreRef.current); return }
    setRound(next)
  }

  const currentPattern = patterns[round]
  const pct = (timeLeft / DURATION) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <p className="text-center text-white/40 text-sm mb-2">Round {round + 1} / {ROUNDS}</p>
        <div className="text-center mb-4">
          {phase === 'show'
            ? <p className="text-yellow-400 font-bold">Memorize! 👀</p>
            : <p className="text-white/60">Recreate the pattern!</p>
          }
        </div>

        <div className="grid gap-1 mx-auto mb-4" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
          {Array(SIZE * SIZE).fill(0).map((_, i) => {
            const isLit = phase === 'show' ? currentPattern[i] : answer[i]
            return (
              <button
                key={i}
                onPointerDown={() => toggle(i)}
                className={`aspect-square rounded-lg transition-all ${
                  phase === 'show'
                    ? (isLit ? 'bg-yellow-400' : 'bg-white/5')
                    : (isLit ? 'bg-purple-500' : 'bg-white/5 hover:bg-white/15')
                }`}
              />
            )
          })}
        </div>

        {phase === 'copy' && (
          <button
            onClick={submit}
            className="w-full py-3 bg-gradient-to-r from-violet-400 to-purple-500 text-white font-black text-xl rounded-xl transition active:scale-95"
          >
            Submit Pattern
          </button>
        )}
      </div>
    </div>
  )
}
