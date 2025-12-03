'use client';

import React from 'react';
import { Player, GameState } from '../../types';
import { LegStatistics } from '../../stores/gameStore';

interface LegWinnerModalProps {
  legStats: LegStatistics;
  players: Player[];
  gameState: GameState;
  onContinue: () => void;
}

const LegWinnerModal: React.FC<LegWinnerModalProps> = ({
  legStats,
  players,
  gameState,
  onContinue,
}) => {
  const winner = players.find(p => p.id === legStats.winnerId);
  const isCricket = legStats.gameType === 'cricket';

  // Sort players by performance in this leg
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === legStats.winnerId) return -1;
    if (b.id === legStats.winnerId) return 1;
    
    if (isCricket && legStats.cricketStats) {
      const statsA = legStats.cricketStats[a.id];
      const statsB = legStats.cricketStats[b.id];
      return statsB.marksPerRound - statsA.marksPerRound;
    } else if (legStats.playerStats) {
      const statsA = legStats.playerStats[a.id];
      const statsB = legStats.playerStats[b.id];
      return statsB.averagePerTurn - statsA.averagePerTurn;
    }
    return 0;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-bg-card to-bg-elevated rounded-3xl p-4 sm:p-6 max-w-2xl w-full animate-fade-in shadow-2xl border border-white/10 my-auto max-h-[95vh] overflow-y-auto">
        {/* Header with trophy animation */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-neon-yellow/30 to-neon-green/30 mb-2 animate-pulse-glow" style={{ color: '#FFD700' }}>
            <span className="text-3xl sm:text-4xl">🏆</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Leg {legStats.legNumber} Complete!</h2>
          <div className="flex items-center justify-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: winner?.color }}
            >
              {winner?.type === 'ai' ? '🤖' : winner?.name[0].toUpperCase()}
            </div>
            <span className="text-lg text-neon-green font-semibold">{winner?.name} wins!</span>
          </div>
        </div>

        {/* Match Score */}
        <div className="bg-bg-dark/50 rounded-xl p-3 mb-4">
          <h3 className="text-white/60 text-xs text-center mb-2">Match Score</h3>
          <div className="flex items-center justify-center gap-4">
            {players.map((player, idx) => (
              <React.Fragment key={player.id}>
                {idx > 0 && <span className="text-white/40 text-xl">-</span>}
                <div className="text-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-1"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.type === 'ai' ? '🤖' : player.name[0].toUpperCase()}
                  </div>
                  <p className="text-white text-xs mb-0.5">{player.name}</p>
                  <p className="text-2xl font-bold text-neon-green">{gameState.legsWon[player.id]}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
          <p className="text-white/40 text-xs text-center mt-2">
            First to {Math.ceil(gameState.rules.bestOf / 2)} legs wins
          </p>
        </div>

        {/* Leg Statistics */}
        <h3 className="text-white/60 text-xs mb-2">Leg Statistics</h3>
        <div className="space-y-2 mb-4">
          {sortedPlayers.map((player) => {
            const isWinner = player.id === legStats.winnerId;

            if (isCricket && legStats.cricketStats) {
              // Cricket statistics
              const stats = legStats.cricketStats[player.id];
              
              return (
                <div
                  key={player.id}
                  className={`rounded-xl p-3 transition-all ${
                    isWinner
                      ? 'bg-gradient-to-r from-neon-green/20 to-neon-blue/10 ring-1 ring-neon-green/50'
                      : 'bg-bg-dark/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.type === 'ai' ? '🤖' : player.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{player.name}</p>
                      {isWinner && (
                        <p className="text-neon-green text-xs">
                          Winner • {stats.numbersClosed}/7 closed
                        </p>
                      )}
                    </div>
                    {isWinner && <span className="text-xl">🎯</span>}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-bg-elevated/50 rounded-lg p-1.5">
                      <p className="text-white/40 text-[10px] mb-0.5">MPR</p>
                      <p className={`font-bold text-sm ${isWinner ? 'text-neon-green' : 'text-white'}`}>
                        {stats.marksPerRound.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-bg-elevated/50 rounded-lg p-1.5">
                      <p className="text-white/40 text-[10px] mb-0.5">Marks</p>
                      <p className="text-white font-bold text-sm">{stats.totalMarks}</p>
                    </div>
                    <div className="bg-bg-elevated/50 rounded-lg p-1.5">
                      <p className="text-white/40 text-[10px] mb-0.5">Hit %</p>
                      <p className="text-white font-bold text-sm">{stats.hitAccuracy.toFixed(0)}%</p>
                    </div>
                    <div className="bg-bg-elevated/50 rounded-lg p-1.5">
                      <p className="text-white/40 text-[10px] mb-0.5">Best</p>
                      <p className="text-white font-bold text-sm">{stats.bestRound}</p>
                    </div>
                  </div>

                  {/* Additional Cricket stats row */}
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-neon-red">T</span>
                      <span className="text-white/60">{stats.tripleRate.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-neon-green">D</span>
                      <span className="text-white/60">{stats.doubleRate.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-white/40">Darts</span>
                      <span className="text-white/60">{stats.dartsThrown}</span>
                    </div>
                    {stats.totalPoints > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-neon-yellow">Pts</span>
                        <span className="text-white/60">{stats.totalPoints}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            } else if (legStats.playerStats) {
              // X01 statistics
              const stats = legStats.playerStats[player.id];

              return (
                <div
                  key={player.id}
                  className={`rounded-xl p-3 transition-all ${
                    isWinner
                      ? 'bg-gradient-to-r from-neon-green/20 to-neon-blue/10 ring-1 ring-neon-green/50'
                      : 'bg-bg-dark/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.type === 'ai' ? '🤖' : player.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{player.name}</p>
                      {isWinner && (
                        <p className="text-neon-green text-xs">
                          Winner {stats.checkoutScore ? `• ${stats.checkoutScore} checkout` : ''}
                        </p>
                      )}
                    </div>
                    {isWinner && <span className="text-xl">🎯</span>}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-bg-elevated/50 rounded-lg p-1.5">
                      <p className="text-white/40 text-[10px] mb-0.5">Darts</p>
                      <p className="text-white font-bold text-sm">{stats.dartsThrown}</p>
                    </div>
                    <div className="bg-bg-elevated/50 rounded-lg p-1.5">
                      <p className="text-white/40 text-[10px] mb-0.5">Avg (3)</p>
                      <p className={`font-bold text-sm ${isWinner ? 'text-neon-green' : 'text-white'}`}>
                        {stats.averagePerTurn.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-bg-elevated/50 rounded-lg p-1.5">
                      <p className="text-white/40 text-[10px] mb-0.5">Highest</p>
                      <p className="text-white font-bold text-sm">{stats.highestTurn}</p>
                    </div>
                    <div className="bg-bg-elevated/50 rounded-lg p-1.5">
                      <p className="text-white/40 text-[10px] mb-0.5">180s</p>
                      <p className="text-white font-bold text-sm">
                        {stats.highestTurn === 180 ? '1' : '0'}
                      </p>
                    </div>
                  </div>

                  {/* Additional stats row */}
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-neon-red">T</span>
                      <span className="text-white/60">{stats.triplesHit}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-neon-green">D</span>
                      <span className="text-white/60">{stats.doublesHit}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-white/40">Miss</span>
                      <span className="text-white/60">{stats.missedDarts}</span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full py-3 bg-gradient-to-r from-neon-green to-neon-blue rounded-xl text-black font-bold hover:opacity-90 transition-all shadow-lg shadow-neon-green/20"
        >
          Continue to Leg {legStats.legNumber + 1} →
        </button>
      </div>
    </div>
  );
};

export default LegWinnerModal;
