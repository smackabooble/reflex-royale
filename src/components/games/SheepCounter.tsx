import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

export default function SheepCounter({ config, onComplete }: Props) {
  const animals: string[] = (config.animals as string[]) ?? []
  const [phase, setPhase] = useState<'watch' | 'input' | 'result'>('watch')
  const [index, setIndex] = useState(-1)
  const [guess, setGuess] = useState('')
  const [result, setResult] = useState<{ correct: number; guess: number; score: number } | null>(null)
  const startRef = useRef<number>(0)
  const done = useRef(false)

  const finish = useCallback((score: number) => {
    if (done.current) return
    done.current = true
    onComplete(score)
  }, [onComplete])

  const correctCount = animals.filter(a => a === '🐑').length

  useEffect(() => {
    const t = setTimeout(() => {
      setIndex(0)
      startRef.current = Date.now()
    }, 1000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (index < 0 || index >= animals.length) {
      if (index >= animals.length) setPhase('input')
      return
    }
    const t = setTimeout(() => setIndex(n => n + 1), 600)
    return () => clearTimeout(t)
  }, [index, animals.length])

  const submit = () => {
    const g = parseInt(guess, 10)
    if (isNaN(g)) return
    const elapsed = (Date.now() - startRef.current) / 1000
    const diff = Math.abs(g - correctCount)
    let s = 0
    if (diff === 0) s = 500 + Math.max(0, Math.round(300 - elapsed * 10))
    else if (diff === 1) s = 250
    else if (diff === 2) s = 100
    else s = 0
    setResult({ correct: correctCount, guess: g, score: s })
    setPhase('result')
    setTimeout(() => finish(s), 2500)
  }

  const current = animals[index]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center select-none">
      <div className="w-full max-w-xs">
        {phase === 'watch' && (
          <>
            <p className="text-white/40 text-sm mb-6">Count the 🐑 sheep only!</p>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-6">
              <div className="text-8xl transition-all duration-100" key={index}>
                {index < 0 ? '👀' : current ?? ''}
              </div>
            </div>
            <div className="flex gap-1 flex-wrap justify-center">
              {animals.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${i < index ? 'bg-white/60' : i === index ? 'bg-yellow-400' : 'bg-white/10'}`}
                />
              ))}
            </div>
            <p className="text-white/30 text-xs mt-3">{index + 1} / {animals.length}</p>
          </>
        )}

        {phase === 'input' && (
          <div className="slide-up">
            <p className="text-2xl font-black mb-2">How many 🐑 sheep?</p>
            <p className="text-white/40 text-sm mb-6">Type your count</p>
            <input
              type="number"
              value={guess}
              onChange={e => setGuess(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full bg-white/10 border-2 border-white/20 focus:border-yellow-400 rounded-2xl px-6 py-5 text-4xl font-black text-center text-white focus:outline-none mb-4"
              placeholder="?"
              inputMode="numeric"
              autoFocus
            />
            <button
              onClick={submit}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-xl rounded-xl active:scale-95 transition"
            >
              Submit!
            </button>
          </div>
        )}

        {phase === 'result' && result && (
          <div className="slide-up">
            <div className="text-6xl mb-4">{Math.abs(result.guess - result.correct) === 0 ? '🎯' : Math.abs(result.guess - result.correct) <= 1 ? '😅' : '😬'}</div>
            <p className="text-3xl font-black mb-2">
              {result.correct} sheep
              {result.guess === result.correct ? ' ✓' : ` (you said ${result.guess})`}
            </p>
            <p className="text-yellow-400 font-black text-2xl">{result.score} pts</p>
          </div>
        )}
      </div>
    </div>
  )
}
