import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

const SETS = [
  ['🐶','🐱','🐰','🐻','🦊','🐼','🐨','🐯'],
  ['🍎','🍊','🍋','🍇','🍓','🍑','🍒','🍉'],
  ['⚽','🏀','🎾','🏈','⚾','🏐','🏉','🎱'],
  ['🚗','🚕','🚙','🚌','🚎','🚐','🚑','🚒'],
  ['🌹','🌺','🌸','🌼','🌻','🌷','🌱','🌿'],
]

function makeRound() {
  const set = SETS[Math.floor(Math.random() * SETS.length)]
  const main = set[Math.floor(Math.random() * set.length)]
  let odd = set[Math.floor(Math.random() * set.length)]
  while (odd === main) odd = set[Math.floor(Math.random() * set.length)]
  const cells: string[] = Array(16).fill(main)
  const oddIdx = Math.floor(Math.random() * 16)
  cells[oddIdx] = odd
  return { cells, oddIdx }
}

const ROUNDS = 5

export default function OddOneOut({ onComplete }: Props) {
  const [round, setRound] = useState(0)
  const [grid, setGrid] = useState(() => makeRound())
  const [totalScore, setTotalScore] = useState(0)
  const [roundStart, setRoundStart] = useState(Date.now())
  const [flash, setFlash] = useState<number | null>(null)
  const [wrong, setWrong] = useState<number | null>(null)
  const done = useRef(false)
  const totalRef = useRef(0)

  const finish = useCallback((s: number) => {
    if (done.current) return
    done.current = true
    onComplete(s)
  }, [onComplete])

  const click = (i: number) => {
    if (done.current) return
    if (i === grid.oddIdx) {
      const elapsed = Date.now() - roundStart
      const pts = Math.max(0, 1000 - elapsed)
      totalRef.current += pts
      setTotalScore(totalRef.current)
      setFlash(i)
      setTimeout(() => {
        setFlash(null)
        const next = round + 1
        if (next >= ROUNDS) { finish(totalRef.current); return }
        setRound(next)
        setGrid(makeRound())
        setRoundStart(Date.now())
      }, 500)
    } else {
      setWrong(i)
      setTimeout(() => setWrong(null), 400)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-black text-yellow-400">{totalScore}</div>
          <p className="text-white/40 text-sm">Round {round + 1} / {ROUNDS}</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {grid.cells.map((emoji, i) => (
            <button
              key={`${round}-${i}`}
              onPointerDown={() => click(i)}
              className={`aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all
                ${flash === i ? 'bg-green-500 scale-110 pop' : ''}
                ${wrong === i ? 'bg-red-500/50 shake' : ''}
                ${flash === null && wrong !== i ? 'bg-white/5 hover:bg-white/10 active:scale-90' : ''}
              `}
            >
              {emoji}
            </button>
          ))}
        </div>

        <p className="text-center text-white/30 text-sm mt-4">Find the odd one out!</p>
      </div>
    </div>
  )
}
