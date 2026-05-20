import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string; players: Player[]; onSend: (msg: object) => void
}

const COLORS = [
  { name: 'GREEN', bg: 'bg-green-500', text: 'text-green-400' },
  { name: 'BLUE', bg: 'bg-blue-500', text: 'text-blue-400' },
  { name: 'YELLOW', bg: 'bg-yellow-400', text: 'text-yellow-400' },
  { name: 'PURPLE', bg: 'bg-purple-500', text: 'text-purple-400' },
]
const ROUNDS = 6, DURATION = 28

export default function ReactionColor({ onComplete }: Props) {
  const [round, setRound] = useState(0)
  const [target] = useState(() => COLORS[Math.floor(Math.random() * COLORS.length)])
  const [targets] = useState(() => Array.from({ length: ROUNDS }, () => COLORS[Math.floor(Math.random() * COLORS.length)]))
  const [phase, setPhase] = useState<'wait' | 'flash'>('wait')
  const [flashColor, setFlashColor] = useState<typeof COLORS[0] | null>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [feedback, setFeedback] = useState('')
  const done = useRef(false)
  const scoreRef = useRef(0)
  const flashStart = useRef(0)
  const clicked = useRef(false)

  const finish = useCallback((s: number) => { if (done.current) return; done.current = true; onComplete(s) }, [onComplete])

  useEffect(() => {
    if (timeLeft === 0) { finish(scoreRef.current); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, finish])

  const nextRound = useCallback((r: number) => {
    if (done.current) return
    clicked.current = false; setPhase('wait'); setFlashColor(null); setFeedback('')
    const delay = 1500 + Math.random() * 2000
    const tgt = targets[r]
    const pool = [...COLORS]
    const flashSeq = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => pool[Math.floor(Math.random() * pool.length)])
    const insertAt = Math.floor(Math.random() * flashSeq.length)
    flashSeq[insertAt] = tgt

    let i = 0
    const t = setTimeout(() => {
      const show = () => {
        if (done.current) return
        const c = flashSeq[i]
        setFlashColor(c); setPhase('flash')
        const isTarget = c.name === tgt.name
        flashStart.current = Date.now()
        setTimeout(() => {
          if (!clicked.current && isTarget) {
            setFeedback('Too slow! ⏱')
            scoreRef.current = Math.max(0, scoreRef.current - 50)
            setScore(scoreRef.current)
          }
          i++
          if (i >= flashSeq.length) {
            setTimeout(() => {
              const nr = r + 1
              if (nr >= ROUNDS) { finish(scoreRef.current); return }
              setRound(nr); nextRound(nr)
            }, 600)
          } else { setFlashColor(null); setPhase('wait'); setTimeout(show, 400) }
        }, 800)
      }
      show()
    }, delay)
    return () => clearTimeout(t)
  }, [targets, finish])

  useEffect(() => { nextRound(0) }, [])

  const click = () => {
    if (done.current || clicked.current || phase !== 'flash' || !flashColor) return
    clicked.current = true
    const tgt = targets[round]
    if (flashColor.name === tgt.name) {
      const elapsed = Date.now() - flashStart.current
      const pts = Math.max(50, 300 - elapsed)
      scoreRef.current += pts; setScore(scoreRef.current)
      setFeedback(`+${pts} 🎯`)
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 100); setScore(scoreRef.current)
      setFeedback('Wrong color! -100 ❌')
    }
  }

  const tgt = targets[round]
  const pct = (timeLeft / DURATION) * 100

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 select-none transition-colors duration-150 ${flashColor ? flashColor.bg + '/20' : ''}`}
      onPointerDown={click}>
      <div className="w-full max-w-xs text-center pointer-events-none">
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-black text-yellow-400">{score}</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <p className="text-white/40 text-sm mb-2">Round {round + 1} / {ROUNDS}</p>
        <div className={`inline-block px-6 py-3 rounded-2xl border-2 mb-8 ${tgt.text} border-current`}>
          <p className="text-sm text-white/50 mb-1">Click when you see</p>
          <p className="text-3xl font-black">{tgt.name}</p>
        </div>

        <div className={`w-48 h-48 rounded-full mx-auto transition-all duration-150 flex items-center justify-center ${flashColor ? flashColor.bg + ' shadow-2xl' : 'bg-white/5 border-2 border-dashed border-white/20'}`}>
          {phase === 'wait' && <p className="text-white/30 text-sm">Wait…</p>}
        </div>

        {feedback && <p className="text-xl font-black mt-4 text-yellow-400">{feedback}</p>}
        <p className="text-white/30 text-xs mt-6">Tap anywhere when the right color appears!</p>
      </div>
    </div>
  )
}
