import { useState, useRef } from 'react'
import { getCoins } from '../utils/coins'
import Shop from './Shop'

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

export default function Lobby({ onJoin }: Props) {
  const [name, setName] = useState(() => localStorage.getItem('playerName') ?? '')
  const [avatar, setAvatar] = useState(() => localStorage.getItem('playerAvatar') ?? '')
  const [joinCode, setJoinCode] = useState('')
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [error, setError] = useState('')
  const [showShop, setShowShop] = useState(false)
  const [coins, setCoins] = useState(getCoins)
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">

      {/* ── Main menu ── */}
      {!showShop && (
        <div className="w-full max-w-sm slide-up">
          <div className="text-center mb-10">
            <div className="text-7xl mb-4">⚡</div>
            <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Reflex Royale
            </h1>
            <p className="text-white/50 mt-2 text-sm">35 reflex games · real-time multiplayer · free</p>
            <button onClick={() => setShowShop(true)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 font-bold text-sm hover:bg-yellow-400/20 active:scale-95 transition">
              Shop &nbsp;·&nbsp; 🪙 {coins.toLocaleString()}
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex flex-col items-center mb-5">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
              <div className="relative group cursor-pointer mb-2" onClick={() => fileRef.current?.click()}>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all
                  ${avatar ? 'border-yellow-400' : 'border-dashed border-white/20 group-hover:border-yellow-400/60'}`}>
                  {avatar
                    ? <img src={avatar} className="w-full h-full object-cover" alt="avatar" />
                    : <div className="flex flex-col items-center text-white/30 group-hover:text-white/60 transition-colors">
                        <span className="text-2xl">📷</span>
                        <span className="text-[10px] mt-0.5">Photo</span>
                      </div>
                  }
                </div>
                {avatar && (
                  <button onClick={removeAvatar}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-400">
                    ×
                  </button>
                )}
              </div>
              <p className="text-white/25 text-xs">Profile photo (optional)</p>
            </div>

            <div className="mb-5">
              <label className="text-xs text-white/50 uppercase tracking-widest mb-2 block">Your name</label>
              <input
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 transition font-semibold text-lg"
                placeholder="John Doe"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); localStorage.setItem('playerName', e.target.value) }}
                maxLength={20}
                onKeyDown={e => e.key === 'Enter' && tab === 'join' && go(joinCode)}
              />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>

            <div className="flex gap-2 mb-5">
              {(['create', 'join'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-xl font-bold text-sm transition ${tab === t ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60 hover:bg-white/15'}`}>
                  {t === 'create' ? '✨ Create Room' : '🔗 Join Room'}
                </button>
              ))}
            </div>

            {tab === 'create' ? (
              <button onClick={() => go(randomCode())}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-black text-xl rounded-xl transition active:scale-95">
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
                <button onClick={() => go(joinCode)} disabled={!joinCode.trim()}
                  className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 disabled:opacity-40 text-black font-black text-xl rounded-xl transition active:scale-95">
                  Join Room
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-white/30 text-xs mt-6">Share the room code with friends to play together</p>
        </div>
      )}

      {/* ── Shop ── */}
      {showShop && (
        <div className="w-full max-w-sm slide-in-right bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: 'calc(100dvh - 2rem)' }}>
          <Shop onClose={() => { setShowShop(false); setCoins(getCoins()) }} />
        </div>
      )}

    </div>
  )
}
