import { useState, useEffect, useRef } from 'react'
import type { Player } from '../../types'

interface Props {
  config: Record<string, unknown>
  onComplete: (score: number) => void
  myId: string
  players: Player[]
  onSend: (msg: object) => void
}

export default function HotPotato({ myId, players, onSend }: Props) {
  const [holderId, setHolderId] = useState<string | null>(null)
  const [explodedId, setExplodedId] = useState<string | null>(null)
  const [bombsLeft, setBombsLeft] = useState(3)
  const [exploding, setExploding] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail
      if (msg.type === 'hot-potato-update') {
        setHolderId(msg.holderId)
        setExploding(false)
        setExplodedId(null)
      } else if (msg.type === 'hot-potato-explode') {
        setExplodedId(msg.loserId)
        setBombsLeft(msg.bombsLeft)
        setExploding(true)
        setHolderId(null)
      }
    }
    window.addEventListener('hp', handler)
    return () => window.removeEventListener('hp', handler)
  }, [])

  const iHave = holderId === myId
  const holderPlayer = players.find(p => p.id === holderId)
  const loserPlayer = players.find(p => p.id === explodedId)

  const pass = () => {
    if (!iHave) return
    onSend({ type: 'hot-potato-pass' })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center select-none">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-white/40 text-sm">Bombs left: {'💣'.repeat(bombsLeft)}</p>
        </div>

        {!holderId && !exploding && (
          <div className="text-6xl animate-pulse">🥔</div>
        )}

        {exploding && loserPlayer && (
          <div className="slide-up">
            <div className="text-8xl mb-4">💥</div>
            <p className="text-3xl font-black text-red-400 flex items-center justify-center gap-2">
              {loserPlayer.avatar
                ? <img src={loserPlayer.avatar} className="w-9 h-9 rounded-full object-cover inline-block" alt="" />
                : <span>{loserPlayer.emoji}</span>}
              {loserPlayer.name} exploded!
            </p>
            <p className="text-white/50 mt-2">Next round starting…</p>
          </div>
        )}

        {holderId && !exploding && (
          <div className="slide-up">
            {iHave ? (
              <>
                <div className="text-8xl mb-6 danger-glow rounded-full w-36 h-36 flex items-center justify-center mx-auto">🥔</div>
                <p className="text-2xl font-black text-orange-400 mb-6">YOU HAVE IT!</p>
                <button
                  onPointerDown={pass}
                  className="w-full py-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-black text-3xl rounded-2xl transition active:scale-95 shadow-xl shadow-red-500/40"
                >
                  🚀 PASS!
                </button>
                <p className="text-white/30 text-sm mt-3">Pass before it explodes!</p>
              </>
            ) : (
              <>
                <div className="text-8xl mb-4">😌</div>
                <p className="text-2xl font-bold text-green-400">You're safe!</p>
                {holderPlayer && (
                  <p className="text-white/50 mt-2 flex items-center justify-center gap-2">
                    {holderPlayer.avatar
                      ? <img src={holderPlayer.avatar} className="w-6 h-6 rounded-full object-cover inline-block" alt="" />
                      : <span>{holderPlayer.emoji}</span>}
                    <span className="font-bold">{holderPlayer.name}</span> has the potato
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
