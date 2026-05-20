import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

interface Q { word: string; ink: string; answer: string }
const DURATION = 25
const INK_CSS: Record<string, string> = {
  red: 'text-red-400',
  blue: 'text-blue-400',
  green: 'text-green-400',
  yellow: 'text-yellow-300',
}
const BTN_CSS: Record<string, string> = {
  red: 'bg-red-500 hover:bg-red-400',
  blue: 'bg-blue-500 hover:bg-blue-400',
  green: 'bg-green-500 hover:bg-green-400',
  yellow: 'bg-yellow-400 hover:bg-yellow-300 text-black',
}

export default function StroopEffect({ config, onComplete }: Props) {
  const questions: Q[] = (config.questions as Q[]) ?? []
  const [qi, setQi] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const done = useRef(false)
  const scoreRef = useRef(0)

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

  const answer = (choice: string) => {
    if (done.current || qi >= questions.length) return
    const q = questions[qi]
    const correct = choice === q.answer
    setFlash(correct ? 'correct' : 'wrong')
    if (correct) {
      const s = scoreRef.current + 60
      scoreRef.current = s
      setScore(s)
    }
    setTimeout(() => {
      setFlash(null)
      if (qi + 1 >= questions.length) { finish(scoreRef.current); return }
      setQi(n => n + 1)
    }, 350)
  }

  if (!questions.length) return <div className="min-h-screen flex items-center justify-center text-white/40">Loading…</div>

  const q = questions[Math.min(qi, questions.length - 1)]
  const pct = (timeLeft / DURATION) * 100
  const colors = ['red', 'blue', 'green', 'yellow']

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-150 ${flash === 'correct' ? 'bg-green-900/30' : flash === 'wrong' ? 'bg-red-900/30' : ''}`}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <div className="text-center mb-10">
          <p className="text-white/30 text-sm mb-4">{qi + 1} / {questions.length}</p>
          <p className="text-7xl font-black tracking-widest uppercase">
            <span className={INK_CSS[q.ink] ?? 'text-white'}>{q.word}</span>
          </p>
          <p className="text-white/40 text-sm mt-3">Click the COLOR of the text</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {colors.map(c => (
            <button
              key={c}
              onPointerDown={() => answer(c)}
              className={`py-4 rounded-2xl font-black text-lg transition active:scale-95 ${BTN_CSS[c]}`}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
