import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

type Color = 'green' | 'blue' | 'red'
interface Cell { color: Color; id: number }

const DURATION = 20
let uid = 0

function makeCell(): Cell {
  const r = Math.random()
  const color: Color = r < 0.5 ? 'green' : r < 0.8 ? 'blue' : 'red'
  return { color, id: uid++ }
}

function makeCells(): Cell[] {
  return Array.from({ length: 20 }, makeCell)
}

const STYLES: Record<Color, string> = {
  green: 'bg-green-500 hover:bg-green-400 shadow-green-500/40',
  blue: 'bg-blue-500 hover:bg-blue-400 shadow-blue-500/40',
  red: 'bg-red-500 shadow-red-500/40',
}

export default function DontClickRed({ onComplete }: Props) {
  const [cells, setCells] = useState<Cell[]>(makeCells)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [dead, setDead] = useState(false)
  const [lastClicked, setLastClicked] = useState<number | null>(null)
  const done = useRef(false)
  const scoreRef = useRef(0)

  const finish = useCallback((s: number) => {
    if (done.current) return
    done.current = true
    onComplete(s)
  }, [onComplete])

  useEffect(() => {
    if (timeLeft === 0 || dead) { finish(scoreRef.current); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, dead, finish])

  const click = (cell: Cell) => {
    if (done.current || dead) return
    setLastClicked(cell.id)
    if (cell.color === 'red') {
      setDead(true)
      return
    }
    const s = scoreRef.current + 50
    scoreRef.current = s
    setScore(s)
    setCells(prev => prev.map(c => c.id === cell.id ? makeCell() : c))
  }

  const pct = (timeLeft / DURATION) * 100

  if (dead) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="text-8xl mb-4 shake">💀</div>
        <h2 className="text-3xl font-black text-red-400 mb-2">You clicked red!</h2>
        <p className="text-white/60">Score: <span className="text-yellow-400 font-bold">{score}</span></p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-3xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {cells.map(cell => (
            <button
              key={cell.id}
              onPointerDown={() => click(cell)}
              className={`aspect-square rounded-2xl shadow-lg transition-all active:scale-90 ${STYLES[cell.color]} ${lastClicked === cell.id ? 'pop' : ''}`}
            />
          ))}
        </div>

        <p className="text-center text-white/30 text-sm mt-4">
          Click <span className="text-green-400">green</span> & <span className="text-blue-400">blue</span> — AVOID <span className="text-red-400">red</span>!
        </p>
      </div>
    </div>
  )
}
