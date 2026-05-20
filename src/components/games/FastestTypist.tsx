import { useState, useEffect, useRef, useCallback } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

const PHRASES = [
  'the quick brown fox jumps over the lazy dog',
  'pack my box with five dozen liquor jugs',
  'how vexingly quick daft zebras jump',
  'the five boxing wizards jump quickly',
  'sphinx of black quartz judge my vow',
  'crazy fredrick bought many very exquisite opal jewels',
  'we promptly judged antique ivory buckles for the next prize',
  'a mad boxer shot a quick gloved jab',
]

export default function FastestTypist({ onComplete }: Props) {
  const phrase = useRef(PHRASES[Math.floor(Math.random() * PHRASES.length)])
  const [typed, setTyped] = useState('')
  const [startTime, setStartTime] = useState<number | null>(null)
  const [done2, setDone2] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const done = useRef(false)

  const finish = useCallback((score: number) => {
    if (done.current) return
    done.current = true
    onComplete(score)
  }, [onComplete])

  useEffect(() => {
    const t = setTimeout(() => { if (!done.current) finish(0) }, 35000)
    inputRef.current?.focus()
    return () => clearTimeout(t)
  }, [finish])

  const handleChange = (val: string) => {
    if (done.current) return
    if (!startTime && val.length > 0) setStartTime(Date.now())
    setTyped(val)
    if (val === phrase.current) {
      const elapsed = (Date.now() - (startTime ?? Date.now())) / 1000
      const words = phrase.current.split(' ').length
      const wpm = Math.round((words / elapsed) * 60)
      const correct = [...val].filter((c, i) => c === phrase.current[i]).length
      const accuracy = Math.round((correct / phrase.current.length) * 100)
      const score = Math.round(wpm * (accuracy / 100))
      setDone2(true)
      setTimeout(() => finish(score), 1500)
    }
  }

  const target = phrase.current
  const pct = Math.round((typed.length / target.length) * 100)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-teal-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 font-mono text-xl leading-relaxed mb-4">
            {target.split('').map((char, i) => {
              const t = typed[i]
              let cls = 'text-white/30'
              if (t !== undefined) {
                cls = t === char ? 'text-green-400' : 'text-red-400 bg-red-400/20'
              }
              if (i === typed.length) cls = 'text-white border-b-2 border-white'
              return <span key={i} className={cls}>{char}</span>
            })}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={typed}
            onChange={e => handleChange(e.target.value)}
            disabled={done2}
            className="w-full bg-white/10 border border-white/20 focus:border-green-400 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none transition"
            placeholder="Start typing…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        {done2 && (
          <p className="text-center text-green-400 font-black text-2xl slide-up">Done! 🎉</p>
        )}
      </div>
    </div>
  )
}
