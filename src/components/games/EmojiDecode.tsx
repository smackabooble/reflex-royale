import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

interface Puzzle { emojis: string; answer: string }
const DURATION = 25

export default function EmojiDecode({ config, onComplete }: Props) {
  const puzzles: Puzzle[] = (config.puzzles as Puzzle[]) ?? []
  const [pi, setPi] = useState(0)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const done = useRef(false)
  const scoreRef = useRef(0)
  const pStart = useRef(Date.now())

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

  const submit = () => {
    if (done.current || !puzzles.length || flash) return
    const puzzle = puzzles[pi]
    const correct = input.toLowerCase().trim() === puzzle.answer.toLowerCase()
    setFlash(correct ? 'correct' : 'wrong')
    if (correct) {
      const elapsed = Date.now() - pStart.current
      const pts = Math.max(50, 400 - Math.floor(elapsed / 15))
      scoreRef.current += pts
      setScore(scoreRef.current)
    }
    setTimeout(() => {
      setFlash(null)
      setInput('')
      pStart.current = Date.now()
      const next = pi + 1
      if (next >= puzzles.length) { finish(scoreRef.current); return }
      setPi(next)
    }, 600)
  }

  if (!puzzles.length) return <div className="min-h-screen flex items-center justify-center text-white/40">Loading…</div>

  if (pi >= puzzles.length) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <div className="text-7xl mb-4">🎉</div>
      <h2 className="text-3xl font-black text-yellow-400">All Decoded!</h2>
      <p className="text-white/60 mt-2">Score: <span className="text-yellow-400 font-bold">{score}</span></p>
    </div>
  )

  const puzzle = puzzles[pi]
  const pct = (timeLeft / DURATION) * 100

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-150 ${flash === 'correct' ? 'bg-green-900/30' : flash === 'wrong' ? 'bg-red-900/30' : ''}`}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-pink-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <p className="text-center text-white/40 text-sm mb-4">Puzzle {pi + 1} / {puzzles.length}</p>
        <div className="text-center mb-8">
          <p className="text-7xl mb-3">{puzzle.emojis}</p>
          <p className="text-white/40 text-sm">What word/phrase do these emojis represent?</p>
          {flash === 'wrong' && <p className="text-red-400 text-sm mt-2">Answer: {puzzle.answer}</p>}
        </div>

        <input
          autoFocus
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-xl font-bold focus:outline-none focus:border-yellow-400 transition mb-4"
          placeholder="Type your answer…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          disabled={!!flash}
        />
        <button
          onClick={submit}
          disabled={!!flash || !input.trim()}
          className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-xl rounded-xl transition active:scale-95 disabled:opacity-40"
        >
          Decode!
        </button>
      </div>
    </div>
  )
}
