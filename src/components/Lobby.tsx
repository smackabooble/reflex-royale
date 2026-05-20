import { useState, useRef } from 'react'

interface Props {
  onJoin: (roomId: string, name: string, avatar: string) => void
}

function randomCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase()
}

async function resizeAvatar(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 80; canvas.height = 80
        const ctx = canvas.getContext('2d')!
        const size = Math.min(img.width, img.height)
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 80, 80)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

const GAME_EMOJIS = ['🔨','⚡','🎨','🧠','🔍','🔢','💡','🥔','➕','🎯','⌨️','💨','🎈','🐑','🪙','🔀','⭐','🧩','🃏','👆','🤔','🔗','📋','🎾','🌊']

export default function Lobby({ onJoin }: Props) {
  const [name, setName] = useState(() => localStorage.getItem('playerName') ?? '')
  const [avatar, setAvatar] = useState(() => localStorage.getItem('playerAvatar') ?? '')
  const [joinCode, setJoinCode] = useState('')
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const go = (roomId: string) => {
    if (!name.trim()) { setError('Enter your name first!'); return }
    onJoin(roomId, name.trim(), avatar)
  }

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const data = await resizeAvatar(file)
    setAvatar(data)
    localStorage.setItem('playerAvatar', data)
    e.target.value = ''
  }

  const removeAvatar = (ev: React.MouseEvent) => {
    ev.stopPropagation()
    setAvatar('')
    localStorage.removeItem('playerAvatar')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel — desktop only */}
      <div className="hidden lg:flex flex-col items-center justify-center flex-1 relative overflow-hidden p-12 border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10 text-center">
          <div className="text-8xl mb-6 drop-shadow-[0_0_40px_rgba(250,204,21,0.4)]">⚡</div>
          <h1 className="text-7xl font-black tracking-tight bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4 leading-none">
            Reflex<br/>Royale
          </h1>
          <p className="text-white/40 text-lg mb-12">25 mini-games · real-time · free</p>
          <div className="grid grid-cols-5 gap-4 text-3xl max-w-xs mx-auto">
            {GAME_EMOJIS.map((e, i) => (
              <span key={i} className="opacity-50 hover:opacity-100 transition-opacity cursor-default">{e}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 lg:max-w-md flex flex-col items-center justify-center p-6 slide-up">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-8">
          <div className="text-5xl mb-2">⚡</div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Reflex Royale</h1>
          <p className="text-white/40 text-xs mt-1">25 mini-games · real-time · free</p>
        </div>

        <div className="w-full max-w-sm">
          {/* Avatar uploader */}
          <div className="flex flex-col items-center mb-6">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
            <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
              <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all
                ${avatar ? 'border-yellow-400' : 'border-dashed border-white/20 group-hover:border-yellow-400/60'}`}>
                {avatar
                  ? <img src={avatar} className="w-full h-full object-cover" alt="avatar" />
                  : <div className="flex flex-col items-center text-white/30 group-hover:text-white/60 transition-colors">
                      <span className="text-2xl">📷</span>
                      <span className="text-[10px] mt-1">Add photo</span>
                    </div>
                }
              </div>
              {avatar && (
                <button
                  onClick={removeAvatar}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-400 transition"
                >
                  ×
                </button>
              )}
            </div>
            <p className="text-white/25 text-xs mt-2">Profile photo (optional)</p>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Your name</label>
            <input
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-yellow-400 transition font-semibold text-lg"
              placeholder="John Doe"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); localStorage.setItem('playerName', e.target.value) }}
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && tab === 'join' && go(joinCode)}
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
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
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
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

          <p className="text-center text-white/20 text-xs mt-6">Share the room code with friends to play together</p>
        </div>
      </div>
    </div>
  )
}
