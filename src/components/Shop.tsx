import { useState } from 'react'
import {
  BORDER_ITEMS, TITLE_ITEMS, EMOTE_ITEMS,
  getCoins, spendCoins, getOwned, own, isOwned,
  getEquipped, equip, getEquippedEmotes, setEquippedEmotes,
} from '../utils/coins'

interface Props { onClose: () => void }

function BorderPreview({ border }: { border: string }) {
  const cls = border === 'gold' ? 'ring-gold' : border === 'purple' ? 'ring-purple-pulse' : border === 'rainbow' ? 'ring-rainbow-anim' : ''
  return (
    <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center text-2xl ${cls}`}>
      🧑
    </div>
  )
}

export default function Shop({ onClose }: Props) {
  const [tab, setTab] = useState<'borders' | 'titles' | 'emotes'>('borders')
  const [coins, setCoins] = useState(getCoins)
  const [owned, setOwned] = useState(getOwned)
  const [equippedBorder, setEquippedBorder] = useState(() => getEquipped('border'))
  const [equippedTitle, setEquippedTitle] = useState(() => getEquipped('title'))
  const [equippedEmotes, setEquippedEmotesState] = useState(getEquippedEmotes)

  const buy = (item: { id: string; price: number }): boolean => {
    if (isOwned(item.id)) return true
    if (!spendCoins(item.price)) return false
    own(item.id)
    setOwned(getOwned())
    setCoins(getCoins())
    return true
  }

  const equipBorder = (id: string) => { equip('border', id); setEquippedBorder(id) }
  const equipTitle = (id: string) => {
    const next = equippedTitle === id ? '' : id
    equip('title', next); setEquippedTitle(next)
  }
  const toggleEmote = (id: string) => {
    let next = [...equippedEmotes]
    if (next.includes(id)) next = next.filter(e => e !== id)
    else if (next.length < 4) next.push(id)
    setEquippedEmotes(next); setEquippedEmotesState(next)
  }

  return (
    <div className="fixed inset-0 z-[500] bg-[#0f0f1a] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
        <h2 className="text-xl font-black">🛍 Shop</h2>
        <div className="flex items-center gap-4">
          <span className="text-yellow-400 font-bold text-lg">🪙 {coins.toLocaleString()}</span>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 text-white text-xl font-bold flex items-center justify-center hover:bg-white/20 active:scale-95 transition">
            ×
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 py-3 border-b border-white/10 flex-shrink-0">
        {(['borders', 'titles', 'emotes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition ${tab === t ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60 hover:bg-white/15'}`}>
            {t === 'borders' ? '🔵 Borders' : t === 'titles' ? '🏷 Titles' : '💬 Emotes'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">

        {/* Borders */}
        {tab === 'borders' && (
          <div className="grid grid-cols-2 gap-4">
            {BORDER_ITEMS.map(item => {
              const owned = isOwned(item.id)
              const active = equippedBorder === item.id
              return (
                <div key={item.id} className={`rounded-2xl p-4 border-2 transition ${active ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/10 bg-white/5'}`}>
                  <div className="flex justify-center mb-3">
                    <BorderPreview border={item.id} />
                  </div>
                  <p className="font-bold text-center text-sm mb-3">{item.label}</p>
                  {item.price === 0 || owned ? (
                    <button onClick={() => equipBorder(item.id)}
                      className={`w-full py-2 rounded-lg text-sm font-bold transition active:scale-95 ${active ? 'bg-yellow-400/20 text-yellow-400' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                      {active ? '✓ Equipped' : 'Equip'}
                    </button>
                  ) : (
                    <button onClick={() => { if (buy(item)) equipBorder(item.id) }}
                      disabled={coins < item.price}
                      className="w-full py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black disabled:opacity-40 active:scale-95 transition">
                      🪙 {item.price}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Titles */}
        {tab === 'titles' && (
          <div className="space-y-3">
            <p className="text-white/40 text-sm mb-4">Titles show under your name in the lobby and final results.</p>
            {TITLE_ITEMS.map(item => {
              const owned = isOwned(item.id)
              const active = equippedTitle === item.id
              return (
                <div key={item.id} className={`flex items-center gap-4 px-4 py-4 rounded-xl border-2 transition ${active ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/10 bg-white/5'}`}>
                  <span className="text-2xl flex-shrink-0">{item.label.split(' ')[0]}</span>
                  <p className="font-bold flex-1">{item.label}</p>
                  {owned ? (
                    <button onClick={() => equipTitle(item.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition active:scale-95 ${active ? 'bg-yellow-400/20 text-yellow-400' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                      {active ? '✓ On' : 'Equip'}
                    </button>
                  ) : (
                    <button onClick={() => { if (buy(item)) equipTitle(item.id) }}
                      disabled={coins < item.price}
                      className="px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black disabled:opacity-40 active:scale-95 transition">
                      🪙 {item.price}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Emotes */}
        {tab === 'emotes' && (
          <div>
            <p className="text-white/40 text-sm mb-4">Equip up to 4 emotes to use during games. <span className="text-white/60">{equippedEmotes.length}/4 equipped.</span></p>
            <div className="grid grid-cols-3 gap-3">
              {EMOTE_ITEMS.map(item => {
                const owned = isOwned(item.id)
                const equipped = equippedEmotes.includes(item.id)
                return (
                  <div key={item.id} className={`rounded-xl p-4 border-2 text-center transition ${equipped ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/10 bg-white/5'}`}>
                    <div className="text-4xl mb-2">{item.emoji}</div>
                    <p className="text-xs text-white/50 mb-3">{item.label}</p>
                    {owned ? (
                      <button onClick={() => toggleEmote(item.id)}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${equipped ? 'bg-yellow-400/20 text-yellow-400' : equippedEmotes.length >= 4 ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                        disabled={!equipped && equippedEmotes.length >= 4}>
                        {equipped ? '✓ Equipped' : equippedEmotes.length >= 4 ? 'Full' : 'Equip'}
                      </button>
                    ) : (
                      <button onClick={() => { if (buy(item)) toggleEmote(item.id) }}
                        disabled={coins < item.price}
                        className="w-full py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black disabled:opacity-40 active:scale-95 transition">
                        🪙 {item.price}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
