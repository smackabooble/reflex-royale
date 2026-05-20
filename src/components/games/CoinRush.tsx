import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

const COLS = 15
const ROWS = 10
const DURATION = 20
const CELL = 40

interface Coin { x: number; y: number; collected: boolean }
interface OtherPos { x: number; y: number }

export default function CoinRush({ config, onComplete, myId, players, onSend }: Props) {
  const initialCoins = ((config.coins as { x: number; y: number }[]) ?? []).map(c => ({ ...c, collected: false }))
  const [pos, setPos] = useState({ x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) })
  const [coins, setCoins] = useState<Coin[]>(initialCoins)
  const [others, setOthers] = useState<Record<string, OtherPos>>({})
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const done = useRef(false)
  const scoreRef = useRef(0)
  const posRef = useRef(pos)
  const coinsRef = useRef(coins)
  const keys = useRef<Set<string>>(new Set())

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
    const onMove = (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d.playerId !== myId) setOthers(prev => ({ ...prev, [d.playerId]: { x: d.x, y: d.y } }))
    }
    window.addEventListener('move', onMove)
    return () => window.removeEventListener('move', onMove)
  }, [myId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keys.current.add(e.key)
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.key)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onUp) }
  }, [])

  useEffect(() => {
    if (done.current) return
    const interval = setInterval(() => {
      if (done.current) return
      const k = keys.current
      let { x, y } = posRef.current
      let moved = false
      if ((k.has('ArrowLeft') || k.has('a') || k.has('A')) && x > 0) { x--; moved = true }
      else if ((k.has('ArrowRight') || k.has('d') || k.has('D')) && x < COLS - 1) { x++; moved = true }
      else if ((k.has('ArrowUp') || k.has('w') || k.has('W')) && y > 0) { y--; moved = true }
      else if ((k.has('ArrowDown') || k.has('s') || k.has('S')) && y < ROWS - 1) { y++; moved = true }
      if (moved) {
        posRef.current = { x, y }
        setPos({ x, y })
        onSend({ type: 'move', x, y })
        const ci = coinsRef.current.findIndex(c => !c.collected && c.x === x && c.y === y)
        if (ci !== -1) {
          const next = [...coinsRef.current]
          next[ci] = { ...next[ci], collected: true }
          coinsRef.current = next
          setCoins(next)
          scoreRef.current += 50
          setScore(scoreRef.current)
        }
      }
    }, 120)
    return () => clearInterval(interval)
  }, [onSend])

  const myPlayer = players.find(p => p.id === myId)
  const pct = (timeLeft / DURATION) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2 select-none">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl font-black text-yellow-400">🪙 {score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <div
          className="relative bg-white/5 border border-white/10 rounded-xl overflow-hidden mx-auto"
          style={{ width: COLS * CELL, height: ROWS * CELL }}
        >
          {coins.filter(c => !c.collected).map((c, i) => (
            <div key={i} className="absolute flex items-center justify-center text-lg pointer-events-none"
              style={{ left: c.x * CELL, top: c.y * CELL, width: CELL, height: CELL }}>
              🪙
            </div>
          ))}
          {Object.entries(others).map(([id, op]) => {
            const p = players.find(pl => pl.id === id)
            return (
              <div key={id} className="absolute flex items-center justify-center text-xl pointer-events-none transition-all duration-100"
                style={{ left: op.x * CELL, top: op.y * CELL, width: CELL, height: CELL }}>
                {p?.emoji ?? '👤'}
              </div>
            )
          })}
          <div className="absolute flex items-center justify-center text-2xl pointer-events-none"
            style={{ left: pos.x * CELL, top: pos.y * CELL, width: CELL, height: CELL }}>
            {myPlayer?.emoji ?? '⭐'}
          </div>
        </div>

        <div className="flex gap-3 justify-center mt-4">
          {[['←','ArrowLeft'],['↑','ArrowUp'],['↓','ArrowDown'],['→','ArrowRight']].map(([label, key]) => (
            <button key={key} className="w-12 h-12 bg-white/10 rounded-xl font-bold text-lg active:bg-white/20"
              onPointerDown={() => keys.current.add(key)}
              onPointerUp={() => keys.current.delete(key)}
              onPointerLeave={() => keys.current.delete(key)}>
              {label}
            </button>
          ))}
        </div>
        <p className="text-center text-white/30 text-xs mt-2">Arrow keys / WASD to move · Collect 🪙 coins!</p>
      </div>
    </div>
  )
}
