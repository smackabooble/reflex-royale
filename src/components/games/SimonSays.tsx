import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

type Color = 'red' | 'blue' | 'green' | 'yellow'
type Phase = 'showing' | 'input' | 'fail' | 'done'

const COLORS: Color[] = ['red', 'blue', 'green', 'yellow']
const STYLES: Record<Color, { base: string; active: string }> = {
  red:    { base: 'bg-red-900 border-red-700',    active: 'bg-red-400 shadow-red-400/80 shadow-xl' },
  blue:   { base: 'bg-blue-900 border-blue-700',   active: 'bg-blue-400 shadow-blue-400/80 shadow-xl' },
  green:  { base: 'bg-green-900 border-green-700', active: 'bg-green-400 shadow-green-400/80 shadow-xl' },
  yellow: { base: 'bg-yellow-900 border-yellow-700',active: 'bg-yellow-300 shadow-yellow-300/80 shadow-xl' },
}

function rng(seed: number, i: number): number {
  let x = Math.sin(seed + i) * 9999
  return Math.floor((x - Math.floor(x)) * 4)
}

export default function SimonSays({ config, onComplete }: Props) {
  const seed = (config.seed as number) ?? 42
  const [sequence, setSequence] = useState<Color[]>([])
  const [lit, setLit] = useState<Color | null>(null)
  const [inputIndex, setInputIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('showing')
  const [round, setRound] = useState(1)
  const done = useRef(false)

  const finish = useCallback((score: number) => {
    if (done.current) return
    done.current = true
    onComplete(score)
  }, [onComplete])

  const showSequence = useCallback(async (seq: Color[]) => {
    setPhase('showing')
    await delay(600)
    for (const color of seq) {
      setLit(color)
      await delay(500)
      setLit(null)
      await delay(300)
    }
    setPhase('input')
    setInputIndex(0)
  }, [])

  useEffect(() => {
    const seq: Color[] = [COLORS[rng(seed, 0)]]
    setSequence(seq)
    showSequence(seq)
  }, [seed, showSequence])

  const handlePress = (color: Color) => {
    if (phase !== 'input' || done.current) return
    setLit(color)
    setTimeout(() => setLit(null), 200)

    if (color !== sequence[inputIndex]) {
      setPhase('fail')
      const score = (sequence.length - 1) * 100
      setTimeout(() => finish(score), 2000)
      return
    }

    const next = inputIndex + 1
    if (next === sequence.length) {
      setPhase('showing')
      const nextRound = round + 1
      setRound(nextRound)
      const newSeq = [...sequence, COLORS[rng(seed, sequence.length)]]
      setSequence(newSeq)
      setTimeout(() => showSequence(newSeq), 800)
    } else {
      setInputIndex(next)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs">
        <div className="text-center mb-6">
          <p className="text-white/40 text-sm">Round {round} · {sequence.length} colors</p>
          {phase === 'showing' && <p className="text-yellow-400 font-bold mt-1">Watch…</p>}
          {phase === 'input' && <p className="text-green-400 font-bold mt-1">Your turn! ({sequence.length - inputIndex} left)</p>}
          {phase === 'fail' && <p className="text-red-400 font-black mt-1 shake">Wrong! Score: {(sequence.length - 1) * 100}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {COLORS.map(color => (
            <button
              key={color}
              onPointerDown={() => handlePress(color)}
              className={`aspect-square rounded-3xl border-4 transition-all duration-100 text-4xl flex items-center justify-center font-black
                ${lit === color ? STYLES[color].active : STYLES[color].base}
              `}
            >
              {lit === color ? '✨' : ''}
            </button>
          ))}
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          {phase === 'input' ? 'Repeat the sequence!' : 'Memorize the pattern…'}
        </p>
      </div>
    </div>
  )
}

function delay(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}
