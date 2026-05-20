import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string; players: Player[]; onSend: (msg: object) => void
}

type Move = 'rock' | 'paper' | 'scissors'
const MOVES: Move[] = ['rock', 'paper', 'scissors']
const EMOJI: Record<Move, string> = { rock: '🪨', paper: '📄', scissors: '✂️' }
const BEATS: Record<Move, Move> = { rock: 'scissors', paper: 'rock', scissors: 'paper' }
const ROUNDS = 7
const DURATION = 25

export default function RPSDuel({ onComplete }: Props) {
  const [round, setRound] = useState(0)
  const [cpuMove, setCpuMove] = useState<Move | null>(null)
  const [playerMove, setPlayerMove] = useState<Move | null>(null)
  const [wins, setWins] = useState(0)
  const [result, setResult] = useState<'win' | 'lose' | 'tie' | null>(null)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const done = useRef(false)
  const winsRef = useRef(0)
  const picking = useRef(false)

  const finish = useCallback((w: number) => { if (done.current) return; done.current = true; onComplete(w * 300) }, [onComplete])

  useEffect(() => {
    if (timeLeft === 0) { finish(winsRef.current); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, finish])

  const pick = (move: Move) => {
    if (done.current || picking.current || round >= ROUNDS) return
    picking.current = true
    const cpu = MOVES[Math.floor(Math.random() * 3)]
    setCpuMove(cpu); setPlayerMove(move)
    const r = move === cpu ? 'tie' : BEATS[move] === cpu ? 'win' : 'lose'
    setResult(r)
    if (r === 'win') { winsRef.current++; setWins(winsRef.current) }
    setTimeout(() => {
      setCpuMove(null); setPlayerMove(null); setResult(null)
      const next = round + 1
      picking.current = false
      if (next >= ROUNDS) { finish(winsRef.current); return }
      setRound(next)
    }, 900)
  }

  const pct = (timeLeft / DURATION) * 100
  const resultColor = result === 'win' ? 'text-green-400' : result === 'lose' ? 'text-red-400' : 'text-yellow-400'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs text-center">
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-black text-yellow-400">{wins} W</div>
          <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-white/60 font-bold w-6 text-right">{timeLeft}</div>
        </div>

        <p className="text-white/40 text-sm mb-2">Round {round + 1} / {ROUNDS}</p>

        <div className="flex items-center justify-center gap-8 mb-6 h-24">
          <div className="text-6xl">{playerMove ? EMOJI[playerMove] : '❓'}</div>
          <div className="text-white/30 text-2xl font-black">VS</div>
          <div className="text-6xl">{cpuMove ? EMOJI[cpuMove] : '🤖'}</div>
        </div>

        {result && (
          <p className={`text-2xl font-black mb-4 ${resultColor}`}>
            {result === 'win' ? 'YOU WIN! +300' : result === 'lose' ? 'CPU WINS!' : "IT'S A TIE!"}
          </p>
        )}

        <div className="flex gap-4 justify-center">
          {MOVES.map(m => (
            <button key={m} onPointerDown={() => pick(m)} disabled={!!result}
              className="w-20 h-20 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-90 transition-all text-4xl flex items-center justify-center disabled:opacity-40">
              {EMOJI[m]}
            </button>
          ))}
        </div>
        <p className="text-white/30 text-xs mt-4">Beat the CPU as many times as you can!</p>
      </div>
    </div>
  )
}
