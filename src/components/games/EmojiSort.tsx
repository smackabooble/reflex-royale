import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string; players: Player[]; onSend: (msg: object) => void
}

const CATEGORIES: [string, string[], string, string][] = [
  ['🐾 Animal', ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🦁','🐯','🦄','🐸'], '🍎 Food', ['🍎','🍊','🍋','🍇','🍓','🍑','🍒','🍕','🍔','🌮','🍜','🍣']],
  ['⚽ Sport', ['⚽','🏀','🎾','🏈','⚾','🏐','🏉','🎱','🏓','🏸','🥊','🎿'], '🚗 Vehicle', ['🚗','🚕','🚙','🚌','🚎','🚐','🚑','🚒','✈️','🚀','🚂','⛵']],
]

const DURATION = 20

export default function EmojiSort({ onComplete }: Props) {
  const [catSet] = useState(() => CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)])
  const [queue] = useState(() => {
    const [, a, , b] = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
    return [...a, ...b].sort(() => Math.random() - 0.5).slice(0, 20)
  })
  const [qi, setQi] = useState(0)
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<'left' | 'right' | null>(null)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const done = useRef(false)
  const scoreRef = useRef(0)

  const [, leftEmojis, , rightEmojis] = catSet
  const leftLabel = catSet[0], rightLabel = catSet[2]

  const finish = useCallback((s: number) => { if (done.current) return; done.current = true; onComplete(s) }, [onComplete])

  useEffect(() => {
    if (timeLeft === 0) { finish(scoreRef.current); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, finish])

  const sort = (side: 'left' | 'right') => {
    if (done.current || flash || qi >= queue.length) return
    const emoji = queue[qi]
    const correctLeft = leftEmojis.includes(emoji)
    const correct = (side === 'left' && correctLeft) || (side === 'right' && !correctLeft)
    setFlash(side)
    if (correct) { scoreRef.current += 80; setScore(scoreRef.current) } else { scoreRef.current = Math.max(0, scoreRef.current - 20); setScore(scoreRef.current) }
    setTimeout(() => {
      setFlash(null)
      const next = qi + 1
      if (next >= queue.length) { finish(scoreRef.current); return }
      setQi(next)
    }, 300)
  }

  const pct = (timeLeft / DURATION) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <div className="text-center mb-6">
          <p className="text-8xl mb-2">{qi < queue.length ? queue[qi] : '✅'}</p>
          <p className="text-white/40 text-sm">{qi + 1} / {queue.length}</p>
        </div>

        <div className="flex gap-3">
          <button onPointerDown={() => sort('left')} disabled={!!flash}
            className={`flex-1 py-6 rounded-2xl font-black text-lg transition active:scale-95 ${flash === 'left' ? 'bg-blue-500' : 'bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30'}`}>
            {leftLabel}
          </button>
          <button onPointerDown={() => sort('right')} disabled={!!flash}
            className={`flex-1 py-6 rounded-2xl font-black text-lg transition active:scale-95 ${flash === 'right' ? 'bg-orange-500' : 'bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/30'}`}>
            {rightLabel}
          </button>
        </div>
        <p className="text-center text-white/30 text-xs mt-4">Sort as fast as you can! Wrong = -20pts</p>
      </div>
    </div>
  )
}
