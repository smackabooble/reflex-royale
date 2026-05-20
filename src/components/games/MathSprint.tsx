import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

interface Q { a: number; b: number; op: string; answer: number }
const DURATION = 30

export default function MathSprint({ config, onComplete }: Props) {
  const questions: Q[] = (config.questions as Q[]) ?? []
  const [qi, setQi] = useState(0)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const done = useRef(false)
  const scoreRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => { inputRef.current?.focus() }, [qi])

  const submit = () => {
    if (done.current || qi >= questions.length) return
    const q = questions[qi]
    const correct = parseInt(input, 10) === q.answer
    setFlash(correct ? 'correct' : 'wrong')
    if (correct) {
      const s = scoreRef.current + 100
      scoreRef.current = s
      setScore(s)
    }
    setInput('')
    setTimeout(() => {
      setFlash(null)
      if (qi + 1 >= questions.length) { finish(scoreRef.current); return }
      setQi(n => n + 1)
    }, 400)
  }

  if (!questions.length) return <div className="min-h-screen flex items-center justify-center text-white/40">Loading…</div>

  const q = questions[Math.min(qi, questions.length - 1)]
  const pct = (timeLeft / DURATION) * 100

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-150 ${flash === 'correct' ? 'bg-green-900/30' : flash === 'wrong' ? 'bg-red-900/30' : ''}`}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <div className="text-center mb-8">
          <p className="text-white/30 text-sm mb-3">{qi + 1} / {questions.length}</p>
          <p className="text-6xl font-black tracking-wide">
            {q.a} <span className="text-yellow-400">{q.op}</span> {q.b} = ?
          </p>
        </div>

        <input
          ref={inputRef}
          type="number"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          className="w-full bg-white/10 border-2 border-white/20 focus:border-yellow-400 rounded-2xl px-6 py-5 text-4xl font-black text-center text-white focus:outline-none transition mb-4"
          placeholder="?"
          inputMode="numeric"
        />

        <button
          onClick={submit}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-black text-xl rounded-xl transition active:scale-95"
        >
          Submit ↵
        </button>
      </div>
    </div>
  )
}
