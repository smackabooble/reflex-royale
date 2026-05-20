import type { Player, RoundScore } from '../types'

interface Props {
  roundScores: RoundScore[]
  players: Player[]
  roundNumber: number
  totalRounds: number
}

const MEDALS = ['🥇','🥈','🥉']

export default function RoundResults({ roundScores, players, roundNumber, totalRounds }: Props) {
  const byId = Object.fromEntries(players.map(p => [p.id, p]))
  const sorted = [...roundScores].sort((a, b) => b.rawScore - a.rawScore)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md slide-up">
        <div className="text-center mb-6">
          <p className="text-white/40 text-sm">Round {roundNumber} / {totalRounds} results</p>
          <h2 className="text-3xl font-black mt-1">Leaderboard</h2>
        </div>

        <div className="space-y-2 mb-6">
          {sorted.map((rs, i) => {
            const p = byId[rs.playerId]
            if (!p) return null
            return (
              <div key={rs.playerId} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${i === 0 ? 'bg-yellow-400/20 border border-yellow-400/40' : 'bg-white/5'}`}>
                <span className="text-2xl w-8 text-center">{MEDALS[i] ?? `${i+1}`}</span>
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-white/10">
                  {p.avatar
                    ? <img src={p.avatar} className="w-full h-full object-cover" alt="" />
                    : <span className="text-xl">{p.emoji}</span>
                  }
                </div>
                <span className="font-bold flex-1">{p.name}</span>
                <div className="text-right">
                  <div className="text-green-400 font-bold text-sm">+{rs.points} pts</div>
                  <div className="text-white/40 text-xs">{p.score} total</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center text-white/30 text-sm animate-pulse">
          {roundNumber < totalRounds ? 'Next round starting…' : 'Game over! Final results…'}
        </div>
      </div>
    </div>
  )
}
