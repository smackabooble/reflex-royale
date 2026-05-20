import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

const EMOJIS = ['🦊','🐯','🦁','🐼','🐨','🦋','🐙','🦄']
const DURATION = 35

function makeBoard() {
  const pairs = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5)
  return pairs.map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }))
}

export default function TileFlip({ onComplete }: Props) {
  const [tiles, setTiles] = useState(() => makeBoard())
  const [selected, setSelected] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [pairs, setPairs] = useState(0)
  const done = useRef(false)
  const scoreRef = useRef(0)
  const checking = useRef(false)

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

  const flip = (i: number) => {
    if (done.current || checking.current) return
    if (tiles[i].flipped || tiles[i].matched) return
    if (selected.length === 1 && selected[0] === i) return

    const next = [...tiles]
    next[i] = { ...next[i], flipped: true }
    setTiles(next)
    const sel = [...selected, i]
    setSelected(sel)

    if (sel.length === 2) {
      checking.current = true
      setTimeout(() => {
        setTiles(prev => {
          const t2 = [...prev]
          if (t2[sel[0]].emoji === t2[sel[1]].emoji) {
            t2[sel[0]] = { ...t2[sel[0]], matched: true }
            t2[sel[1]] = { ...t2[sel[1]], matched: true }
            const newPairs = pairs + 1
            setPairs(newPairs)
            scoreRef.current += 150 + timeLeft * 3
            setScore(scoreRef.current)
            if (newPairs >= EMOJIS.length) { finish(scoreRef.current) }
          } else {
            t2[sel[0]] = { ...t2[sel[0]], flipped: false }
            t2[sel[1]] = { ...t2[sel[1]], flipped: false }
          }
          return t2
        })
        setSelected([])
        checking.current = false
      }, 800)
    }
  }

  const pct = (timeLeft / DURATION) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>
        <p className="text-center text-white/40 text-sm mb-3">Pairs: {pairs} / {EMOJIS.length}</p>

        <div className="grid grid-cols-4 gap-2">
          {tiles.map((tile, i) => (
            <button
              key={tile.id}
              onPointerDown={() => flip(i)}
              className={`aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all
                ${tile.matched ? 'bg-green-500/30 border border-green-500/50' : tile.flipped ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'}
              `}
            >
              {(tile.flipped || tile.matched) ? tile.emoji : ''}
            </button>
          ))}
        </div>
        <p className="text-center text-white/30 text-sm mt-4">Flip tiles to find matching pairs!</p>
      </div>
    </div>
  )
}
