import { useState, useEffect, useRef } from 'react'
import type { Player, RoundScore } from '../types'
import { addCoins, getCoins } from '../utils/coins'
import PlayerAvatar from './PlayerAvatar'

interface Props {
  roundScores: RoundScore[]
  players: Player[]
  roundNumber: number
  totalRounds: number
  myId: string
}

const MEDALS = ['🥇','🥈','🥉']

export default function RoundResults({ roundScores, players, roundNumber, totalRounds, myId }: Props) {
  const byId = Object.fromEntries(players.map(p => [p.id, p]))
  const sorted = [...roundScores].sort((a, b) => b.rawScore - a.rawScore)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [coinTotal, setCoinTotal] = useState(getCoins)
  const didAward = useRef(false)

  useEffect(() => {
    if (didAward.current) return
    didAward.current = true
    const myScore = roundScores.find(rs => rs.playerId === myId)
    if (myScore && myScore.points > 0) {
      const earned = Math.floor(myScore.points / 2)
      const newTotal = addCoins(earned)
      setCoinsEarned(earned)
      setCoinTotal(newTotal)
    }
  }, [myId, roundScores])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md slide-up">
        <div className="text-center mb-6">
          <p className="text-white/40 text-sm">Round {roundNumber} / {totalRounds} results</p>
          <h2 className="text-3xl font-black mt-1">Round Results</h2>
        </div>

        <div className="space-y-2 mb-5">
          {sorted.map((rs, i) => {
            const p = byId[rs.playerId]
            if (!p) return null
            const isMe = rs.playerId === myId
            return (
              <div key={rs.playerId} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${i === 0 ? 'bg-yellow-400/20 border border-yellow-400/40' : 'bg-white/5'} ${isMe ? 'ring-1 ring-yellow-400/50' : ''}`}>
                <span className="text-2xl w-8 text-center">{MEDALS[i] ?? `${i+1}`}</span>
                <PlayerAvatar p={p} size="md" />
                <span className="font-bold flex-1">{p.name}{isMe ? <span className="text-white/40 text-xs ml-1">(you)</span> : ''}</span>
                <div className="text-right">
                  <div className="text-green-400 font-bold text-sm">+{rs.points} pts</div>
                  <div className="text-white/40 text-xs">{p.score} total</div>
                </div>
              </div>
            )
          })}
        </div>

        {coinsEarned > 0 && (
          <div className="coin-pop bg-yellow-400/10 border border-yellow-400/30 rounded-2xl px-5 py-4 text-center mb-5">
            <div className="text-3xl font-black text-yellow-400">+{coinsEarned} 🪙</div>
            <div className="text-white/50 text-sm mt-1">Total: {coinTotal.toLocaleString()} 🪙</div>
          </div>
        )}

        <div className="text-center text-white/30 text-sm animate-pulse">
          {roundNumber < totalRounds ? 'Next round starting…' : 'Game over! Final results…'}
        </div>
      </div>
    </div>
  )
}
