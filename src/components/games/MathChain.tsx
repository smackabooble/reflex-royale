import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

interface Op { a: number; b: number; op: string; answer: number }
const DURATION = 20

export default function MathChain({ config, onComplete }: Props) {
  const ops: Op[] = (config.ops as Op[]) ?? []
  const [qi, setQi] = useState(0)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const done = useRef(false)
  const scoreRef = useRef(0)
  const qStart = useRef(Date.now())

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
    if (done.current || flash || qi >= ops.length) return
    const q = ops[qi]
    const val = parseInt(input, 10)
    const correct = val === q.answer
    setFlash(correct ? 'correct' : 'wrong')
    if (correct) {
      const elapsed = Date.now() - qStart.current
      const pts = Math.max(50, 200 - Math.floor(elapsed / 20))
      scoreRef.current += pts
      setScore(scoreRef.current)
    }
    setTimeout(() => {
      setFlash(null)
      setInput('')
      qStart.current = Date.now()
      const next = qi + 1
      if (next >= ops.length) { finish(scoreRef.current); return }
      setQi(next)
    }, 400)
  }

  if (!ops.length) return <div className="min-h-screen flex items-center justify-center text-white/40">Loading…</div>
  if (qi >= ops.length) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <div className="text-7xl mb-4">🔗</div>
      <h2 className="text-3xl font-black text-green-400">Chain Complete!</h2>
      <p className="text-white/60 mt-2">Score: <span className="text-yellow-400 font-bold">{score}</span></p>
    </div>
  )

  const q = ops[qi]
  const pct = (timeLeft / DURATION) * 100

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-150 ${flash === 'correct' ? 'bg-green-900/30' : flash === 'wrong' ? 'bg-red-900/30' : ''}`}>
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <p className="text-center text-white/40 text-sm mb-6">{qi + 1} / {ops.length}</p>
        <div className="text-center mb-8">
          <p className="text-5xl font-black text-white">
            {q.a} {q.op} {q.b} = ?
          </p>
        </div>

        <input
          autoFocus
          type="number"
          inputMode="numeric"
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-center text-3xl font-black focus:outline-none focus:border-yellow-400 transition mb-4"
          placeholder="?"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          disabled={!!flash}
        />
        <button
          onClick={submit}
          disabled={!!flash || !input.trim()}
          className="w-full py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-black font-black text-xl rounded-xl transition active:scale-95 disabled:opacity-40"
        >
          Submit
        </button>
        {flash === 'wrong' && <p className="text-center text-red-400 text-sm mt-2">Answer was {q.answer}</p>}
      </div>
    </div>
  )
}
