import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

const DURATION = 20

function scramble(word: string) {
  const arr = word.split('')
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.join('') === word ? scramble(word) : arr.join('')
}

export default function WordScramble({ config, onComplete }: Props) {
  const words: string[] = (config.words as string[]) ?? []
  const [wi, setWi] = useState(0)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [scrambled] = useState(() => words.map(w => scramble(w)))
  const done = useRef(false)
  const scoreRef = useRef(0)
  const roundStart = useRef(Date.now())

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
    if (done.current || wi >= words.length) return
    if (input.toLowerCase().trim() === words[wi].toLowerCase()) {
      const elapsed = Date.now() - roundStart.current
      const pts = Math.max(50, 500 - Math.floor(elapsed / 10))
      scoreRef.current += pts
      setScore(scoreRef.current)
      setFlash('correct')
    } else {
      setFlash('wrong')
    }
    setTimeout(() => {
      setFlash(null)
      setInput('')
      roundStart.current = Date.now()
      const next = wi + 1
      if (next >= words.length) { finish(scoreRef.current); return }
      setWi(next)
    }, 500)
  }

  const pct = (timeLeft / DURATION) * 100

  if (!words.length) return <div className="min-h-screen flex items-center justify-center text-white/40">Loading…</div>

  if (wi >= words.length) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <div className="text-7xl mb-4">✅</div>
      <h2 className="text-3xl font-black text-green-400">All words solved!</h2>
      <p className="text-white/60 mt-2">Score: <span className="text-yellow-400 font-bold">{score}</span></p>
    </div>
  )

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-150 ${flash === 'correct' ? 'bg-green-900/30' : flash === 'wrong' ? 'bg-red-900/30' : ''}`}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <p className="text-center text-white/40 text-sm mb-3">Word {wi + 1} / {words.length}</p>
        <div className="text-center mb-8">
          <p className="text-6xl font-black tracking-widest text-white">{scrambled[wi]?.toUpperCase()}</p>
          <p className="text-white/30 text-sm mt-2">Unscramble the word!</p>
        </div>

        <input
          autoFocus
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-2xl font-bold focus:outline-none focus:border-yellow-400 transition mb-4"
          placeholder="Type answer…"
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
          Submit
        </button>
      </div>
    </div>
  )
}
