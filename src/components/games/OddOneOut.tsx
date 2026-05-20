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
const DURATION = 25

export default function OddOneOut({ onComplete }: Props) {
  const [round, setRound] = useState(0)
  const [grid, setGrid] = useState(() => makeRound())
  const [totalScore, setTotalScore] = useState(0)
  const [roundStart, setRoundStart] = useState(Date.now())
  const [flash, setFlash] = useState<number | null>(null)
  const [wrong, setWrong] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [finished, setFinished] = useState(false)
  const done = useRef(false)
  const totalRef = useRef(0)

  const finish = useCallback((s: number) => {
    if (done.current) return
    done.current = true
    setFinished(true)
    setTimeout(() => onComplete(s), 1200)
  }, [onComplete])

  useEffect(() => {
    if (timeLeft === 0) { finish(totalRef.current); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, finish])

  const click = (i: number) => {
    if (done.current || finished) return
    if (i === grid.oddIdx) {
      const elapsed = Date.now() - roundStart
      const pts = Math.max(100, 1000 - Math.floor(elapsed / 2))
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

  const pct = (timeLeft / DURATION) * 100

  if (finished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="text-7xl mb-4">✅</div>
        <h2 className="text-4xl font-black text-green-400 mb-2">All Done!</h2>
        <p className="text-white/60 text-xl">Score: <span className="text-yellow-400 font-bold">{totalScore}</span></p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-black text-yellow-400">{totalScore}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>
        <p className="text-center text-white/40 text-sm mb-3">Round {round + 1} / {ROUNDS}</p>

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
