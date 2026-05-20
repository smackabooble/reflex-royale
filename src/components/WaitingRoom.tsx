import { useState } from 'react'
import type { Player } from '../types'

interface Props {
  roomId: string
  players: Player[]
  myId: string
  isHost: boolean
  onStart: () => void
}

export default function WaitingRoom({ roomId, players, myId, isHost, onStart }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md slide-up">
        <div className="text-center mb-8">
          <p className="text-white/50 text-sm mb-2 uppercase tracking-widest">Room Code</p>
          <button
            onClick={copy}
            className="text-5xl font-black tracking-widest bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent hover:scale-105 transition active:scale-95"
          >
            {roomId}
          </button>
          <p className="text-white/40 text-xs mt-1">{copied ? '✓ Copied!' : 'Tap to copy'}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-4">
            Players ({players.length}/8)
          </p>
          <div className="space-y-2">
            {players.map(p => (
              <div key={p.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${p.id === myId ? 'bg-yellow-400/15 border border-yellow-400/30' : 'bg-white/5'}`}>
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-white/10">
                  {p.avatar
                    ? <img src={p.avatar} className="w-full h-full object-cover" alt="" />
                    : <span className="text-xl">{p.emoji}</span>
                  }
                </div>
                <span className="font-semibold flex-1">{p.name}</span>
                {p.isHost && <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full">HOST</span>}
                {p.id === myId && <span className="text-xs text-white/40">you</span>}
              </div>
            ))}
            {players.length < 2 && (
              <p className="text-center text-white/30 py-4 text-sm">
                Waiting for at least one more player…
              </p>
            )}
          </div>
        </div>

        {isHost ? (
          <button
            onClick={onStart}
            disabled={players.length < 2}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-black text-xl rounded-xl transition active:scale-95"
          >
            {players.length < 2 ? 'Need 2+ players' : '🎮 Start Game!'}
          </button>
        ) : (
          <div className="text-center py-4 text-white/40">
            Waiting for host to start…
          </div>
        )}
      </div>
    </div>
  )
}
