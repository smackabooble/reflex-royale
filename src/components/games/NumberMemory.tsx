import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string; players: Player[]; onSend: (msg: object) => void
}

const ROUNDS = 4
const DURATION = 35

export default function NumberMemory({ config, onComplete }: Props) {
  const sequences: number[][] = (config.sequences as number[][]) ?? []
  const [round, setRound] = useState(0)
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
    if (!sequences.length) return
    setPhase('show')
    const showTime = 1000 + sequences[round]?.length * 400
    const t = setTimeout(() => { setPhase('type'); typeStart.current = Date.now() }, showTime)
    return () => clearTimeout(t)
  }, [round, sequences.length])

  const submit = () => {
    if (done.current || flash) return
    const seq = sequences[round]
    const correct = input.replace(/\s/g, '') === seq.join('')
    setFlash(correct ? 'correct' : 'wrong')
    if (correct) {
      const elapsed = Date.now() - typeStart.current
      const pts = Math.max(100, 400 - Math.floor(elapsed / 20) + seq.length * 50)
      scoreRef.current += pts; setScore(scoreRef.current)
    }
    setTimeout(() => {
      setFlash(null); setInput('')
      const next = round + 1
      if (next >= Math.min(ROUNDS, sequences.length)) { finish(scoreRef.current); return }
      setRound(next)
    }, 700)
  }

  if (!sequences.length) return <div className="min-h-screen flex items-center justify-center text-white/40">Loading…</div>

  const seq = sequences[Math.min(round, sequences.length - 1)]
  const pct = (timeLeft / DURATION) * 100

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-150 ${flash === 'correct' ? 'bg-green-900/30' : flash === 'wrong' ? 'bg-red-900/30' : ''}`}>
      <div className="w-full max-w-xs text-center">
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <p className="text-white/40 text-sm mb-6">Round {round + 1} / {Math.min(ROUNDS, sequences.length)} · {seq.length} digits</p>

        {phase === 'show' ? (
          <div>
            <p className="text-white/50 mb-4">Memorize this number!</p>
            <p className="text-6xl font-black tracking-widest text-white mb-2">{seq.join(' ')}</p>
            <p className="text-white/30 text-sm animate-pulse mt-4">Remember it…</p>
          </div>
        ) : (
          <div>
            <p className="text-white/50 mb-4">Type the number sequence!</p>
            {flash === 'wrong' && <p className="text-red-400 mb-3 text-sm">Correct: <span className="font-mono font-bold">{seq.join('')}</span></p>}
            <input autoFocus type="number" inputMode="numeric"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-center font-mono text-3xl font-black focus:outline-none focus:border-yellow-400 transition mb-4"
              placeholder="Type here…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              disabled={!!flash}
            />
            <button onClick={submit} disabled={!!flash || !input}
              className="w-full py-3 bg-gradient-to-r from-blue-400 to-cyan-500 text-white font-black text-xl rounded-xl transition active:scale-95 disabled:opacity-40">
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
