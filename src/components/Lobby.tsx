import { useState } from 'react'

interface Props {
  onJoin: (roomId: string, name: string) => void
}

function randomCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase()
}

export default function Lobby({ onJoin }: Props) {
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [error, setError] = useState('')

  const go = (roomId: string) => {
    if (!name.trim()) { setError('Enter your name first!'); return }
    onJoin(roomId, name.trim())
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm slide-up">
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">⚡</div>
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Reflex Royale
          </h1>
          <p className="text-white/50 mt-2 text-sm">15 reflex games · real-time multiplayer · free</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="mb-5">
            <label className="text-xs text-white/50 uppercase tracking-widest mb-2 block">Your name</label>
            <input
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 transition font-semibold text-lg"
              placeholder="e.g. Alex 🔥"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && tab === 'join' && go(joinCode)}
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <div className="flex gap-2 mb-5">
            {(['create','join'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl font-bold text-sm transition ${tab === t ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60 hover:bg-white/15'}`}
              >
                {t === 'create' ? '✨ Create Room' : '🔗 Join Room'}
              </button>
            ))}
          </div>

          {tab === 'create' ? (
            <button
              onClick={() => go(randomCode())}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-black text-xl rounded-xl transition active:scale-95"
            >
              Create Game Room
            </button>
          ) : (
            <div className="space-y-3">
              <input
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 transition font-mono text-2xl tracking-widest text-center uppercase"
                placeholder="ABCD"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0,6))}
                onKeyDown={e => e.key === 'Enter' && go(joinCode)}
                maxLength={6}
              />
              <button
                onClick={() => go(joinCode)}
                disabled={!joinCode.trim()}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 disabled:opacity-40 text-black font-black text-xl rounded-xl transition active:scale-95"
              >
                Join Room
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">Share the room code with friends to play together</p>
      </div>
    </div>
  )
}
