import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string; players: Player[]; onSend: (msg: object) => void
}

const DURATION = 30
const SHOW_MS = 3000

export default function PasswordMemory({ config, onComplete }: Props) {
  const passwords: string[] = (config.passwords as string[]) ?? []
  const [pi, setPi] = useState(0)
  const [phase, setPhase] = useState<'show' | 'type'>('show')
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const done = useRef(false)
  const scoreRef = useRef(0)
  const typeStart = useRef(0)

  const finish = useCallback((s: number) => { if (done.current) return; done.current = true; onComplete(s) }, [onComplete])

  useEffect(() => {
    if (timeLeft === 0) { finish(scoreRef.current); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, finish])

  useEffect(() => {
    setPhase('show')
    const t = setTimeout(() => { setPhase('type'); typeStart.current = Date.now() }, SHOW_MS)
    return () => clearTimeout(t)
  }, [pi])

  const submit = () => {
    if (done.current || phase !== 'type' || flash) return
    const pw = passwords[pi]
    const correct = input === pw
    setFlash(correct ? 'correct' : 'wrong')
    if (correct) {
      const elapsed = Date.now() - typeStart.current
      const pts = Math.max(100, 500 - Math.floor(elapsed / 10))
      scoreRef.current += pts; setScore(scoreRef.current)
    }
    setTimeout(() => {
      setFlash(null); setInput('')
      const next = pi + 1
      if (next >= passwords.length) { finish(scoreRef.current); return }
      setPi(next)
    }, 700)
  }

  if (!passwords.length) return <div className="min-h-screen flex items-center justify-center text-white/40">Loading…</div>
  if (pi >= passwords.length) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <div className="text-6xl mb-4">🔐</div>
      <h2 className="text-3xl font-black text-green-400">All memorized!</h2>
      <p className="text-white/60 mt-2">Score: <span className="text-yellow-400 font-bold">{score}</span></p>
    </div>
  )

  const pw = passwords[pi]
  const pct = (timeLeft / DURATION) * 100

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-150 ${flash === 'correct' ? 'bg-green-900/30' : flash === 'wrong' ? 'bg-red-900/30' : ''}`}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <p className="text-center text-white/40 text-sm mb-4">Password {pi + 1} / {passwords.length}</p>

        {phase === 'show' ? (
          <div className="text-center">
            <p className="text-white/50 text-sm mb-4">Memorize this password!</p>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-4">
              <p className="font-mono text-3xl font-black tracking-widest text-white">{pw}</p>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 transition-none rounded-full animate-[shrink_3s_linear_forwards]" style={{ width: '100%', animation: `width ${SHOW_MS}ms linear` }} />
            </div>
            <p className="text-white/30 text-xs mt-2">Disappears in {SHOW_MS / 1000}s…</p>
          </div>
        ) : (
          <div>
            <p className="text-center text-white/50 text-sm mb-4">Type the password from memory!</p>
            <input autoFocus
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-center font-mono text-2xl tracking-widest font-black focus:outline-none focus:border-yellow-400 transition mb-4"
              placeholder="Type it here…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              disabled={!!flash}
            />
            {flash === 'wrong' && <p className="text-center text-red-400 text-sm mb-3">Wrong! It was: <span className="font-mono font-bold">{pw}</span></p>}
            <button onClick={submit} disabled={!!flash || !input}
              className="w-full py-3 bg-gradient-to-r from-indigo-400 to-purple-500 text-white font-black text-xl rounded-xl transition active:scale-95 disabled:opacity-40">
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
