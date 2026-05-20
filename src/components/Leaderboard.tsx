import type { Player } from '../types'

interface Props {
  players: Player[]
  myId: string
  onPlayAgain: () => void
}

const MEDALS = ['🥇','🥈','🥉']
const COLORS = ['from-yellow-400 to-orange-500','from-gray-400 to-gray-500','from-orange-700 to-orange-800']

export default function Leaderboard({ players, myId, onPlayAgain }: Props) {
  const sorted = [...players].sort((a,b) => b.score - a.score)
  const winner = sorted[0]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md slide-up">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="text-4xl font-black">Game Over!</h1>
          {winner && (
            <p className="text-white/60 mt-2">
              {winner.emoji} <span className="text-yellow-400 font-bold">{winner.name}</span> wins!
            </p>
          )}
        </div>

        <div className="space-y-3 mb-8">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${p.id === myId ? 'border-yellow-400/50 bg-yellow-400/10' : 'border-white/10 bg-white/5'}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLORS[i] ?? 'from-white/20 to-white/10'} flex items-center justify-center text-lg font-black`}>
                {MEDALS[i] ?? i + 1}
              </div>
              <span className="text-2xl">{p.emoji}</span>
              <div className="flex-1">
                <p className="font-bold">{p.name} {p.id === myId ? <span className="text-white/40 text-xs">(you)</span> : ''}</p>
              </div>
              <div className="text-2xl font-black text-yellow-400">{p.score}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onPlayAgain}
          className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-black text-xl rounded-xl transition active:scale-95"
        >
          🔄 Play Again
        </button>
      </div>
    </div>
  )
}
