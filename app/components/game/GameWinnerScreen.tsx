'use client';

import React from 'react';
import { GameState, GameStatistics } from '../../types';

interface GameWinnerScreenProps {
  gameState: GameState;
  gameStats: GameStatistics;
  onFinish: () => void;
  onRematch: () => void;
}

const GameWinnerScreen: React.FC<GameWinnerScreenProps> = ({
  gameState,
  gameStats,
  onFinish,
  onRematch,
}) => {
  const winner = gameState.players.find(p => p.id === gameState.matchWinnerId);
  const isCricket = gameState.rules.gameType === 'cricket';

  // Sort players by legs won, then by appropriate stat
  const sortedPlayers = [...gameState.players].sort((a, b) => {
    const legsA = gameState.legsWon[a.id] || 0;
    const legsB = gameState.legsWon[b.id] || 0;
    if (legsB !== legsA) return legsB - legsA;
    
    if (isCricket && gameStats.cricketStats) {
      const statsA = gameStats.cricketStats[a.id];
      const statsB = gameStats.cricketStats[b.id];
      return statsB.marksPerRound - statsA.marksPerRound;
    } else {
      const statsA = gameStats.playerStats[a.id];
      const statsB = gameStats.playerStats[b.id];
      return statsB.averagePerTurn - statsA.averagePerTurn;
    }
  });

  // Calculate game duration
  const startTime = new Date(gameState.startedAt).getTime();
  const endTime = new Date(gameState.completedAt || Date.now()).getTime();
  const durationMs = endTime - startTime;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);

  // Find best stats across all players
  const bestStats = isCricket && gameStats.cricketStats ? {
    mpr: Math.max(...Object.values(gameStats.cricketStats).map(s => s.marksPerRound)),
    hitAccuracy: Math.max(...Object.values(gameStats.cricketStats).map(s => s.hitAccuracy)),
    bestRound: Math.max(...Object.values(gameStats.cricketStats).map(s => s.bestRound)),
    tripleRate: Math.max(...Object.values(gameStats.cricketStats).map(s => s.tripleRate)),
  } : {
    average: Math.max(...Object.values(gameStats.playerStats).map(s => s.averagePerTurn)),
    highest: Math.max(...Object.values(gameStats.playerStats).map(s => s.highestTurn)),
    checkout: Math.max(...Object.values(gameStats.playerStats).map(s => s.highestCheckout || 0)),
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-bg-dark via-bg-card to-bg-dark">
      <div className="max-w-3xl w-full animate-fade-in">
        {/* Winner Celebration */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-6xl animate-bounce" style={{ animationDelay: '0ms' }}>🎯</span>
            <span className="text-6xl animate-bounce" style={{ animationDelay: '100ms' }}>🏆</span>
            <span className="text-6xl animate-bounce" style={{ animationDelay: '200ms' }}>🎯</span>
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-neon-yellow to-neon-green mb-4">
            GAME OVER!
          </h1>
          <div
            className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl mb-4"
            style={{ backgroundColor: winner?.color + '30' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg"
              style={{ backgroundColor: winner?.color }}
            >
              {winner?.type === 'ai' ? '🤖' : winner?.name[0].toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-white/60 text-sm">Champion</p>
              <p className="text-3xl font-bold text-white">{winner?.name}</p>
            </div>
          </div>
        </div>

        {/* Final Score Card */}
        <div className="bg-bg-card rounded-2xl p-6 mb-6 shadow-xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white/60 text-sm font-medium">Final Score</h2>
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>

          <div className="flex items-center justify-center gap-8">
            {gameState.players.map((player, idx) => {
              const isWinner = player.id === gameState.matchWinnerId;
              return (
                <React.Fragment key={player.id}>
                  {idx > 0 && (
                    <div className="text-5xl font-bold text-white/20">-</div>
                  )}
                  <div className={`text-center ${isWinner ? 'scale-110' : 'opacity-60'}`}>
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2 ${
                        isWinner ? 'ring-4 ring-neon-yellow shadow-lg shadow-neon-yellow/30' : ''
                      }`}
                      style={{ backgroundColor: player.color }}
                    >
                      {player.type === 'ai' ? '🤖' : player.name[0].toUpperCase()}
                    </div>
                    <p className="text-white font-medium mb-1">{player.name}</p>
                    <p className={`text-5xl font-black ${isWinner ? 'text-neon-green' : 'text-white/60'}`}>
                      {gameState.legsWon[player.id]}
                    </p>
                    <p className="text-white/40 text-sm">legs</p>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div className="text-center mt-4 pt-4 border-t border-white/10">
            <p className="text-white/40 text-sm">
              {gameState.rules.gameType === 'cricket' ? 'Cricket' : gameState.rules.gameType} • 
              Best of {gameState.rules.bestOf}
              {!isCricket && gameState.rules.doubleOut && ' • Double Out'}
              {isCricket && gameState.rules.cricketVariant && ` • ${gameState.rules.cricketVariant}`}
            </p>
          </div>
        </div>

        {/* Player Statistics */}
        <div className="bg-bg-card rounded-2xl p-6 mb-6 shadow-xl border border-white/5">
          <h2 className="text-white/60 text-sm font-medium mb-4">Game Statistics</h2>
          
          <div className="space-y-4">
            {sortedPlayers.map((player, idx) => {
              const isWinner = player.id === gameState.matchWinnerId;

              if (isCricket && gameStats.cricketStats) {
                // Cricket Statistics
                const stats = gameStats.cricketStats[player.id];
                const hasBestMPR = stats.marksPerRound === bestStats.mpr;
                const hasBestAccuracy = stats.hitAccuracy === bestStats.hitAccuracy;
                const hasBestRound = stats.bestRound === bestStats.bestRound;

                return (
                  <div
                    key={player.id}
                    className={`rounded-xl p-4 ${
                      isWinner
                        ? 'bg-gradient-to-r from-neon-green/15 to-neon-blue/10 ring-1 ring-neon-green/30'
                        : 'bg-bg-elevated/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-dark/50 text-white/60 font-bold">
                        {idx + 1}
                      </div>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.type === 'ai' ? '🤖' : player.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{player.name}</p>
                        <p className="text-white/40 text-sm">
                          {gameState.legsWon[player.id]} leg{gameState.legsWon[player.id] !== 1 ? 's' : ''} won
                        </p>
                      </div>
                      {isWinner && <span className="text-3xl">👑</span>}
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      <div className={`rounded-lg p-3 text-center ${hasBestMPR ? 'bg-neon-green/20 ring-1 ring-neon-green/50' : 'bg-bg-dark/50'}`}>
                        <p className="text-white/40 text-xs mb-1">MPR</p>
                        <p className={`font-bold text-lg ${hasBestMPR ? 'text-neon-green' : 'text-white'}`}>
                          {stats.marksPerRound.toFixed(2)}
                        </p>
                        {hasBestMPR && <p className="text-neon-green text-xs">Best!</p>}
                      </div>
                      <div className="bg-bg-dark/50 rounded-lg p-3 text-center">
                        <p className="text-white/40 text-xs mb-1">Marks</p>
                        <p className="text-white font-bold text-lg">{stats.totalMarks}</p>
                      </div>
                      <div className={`rounded-lg p-3 text-center ${hasBestAccuracy ? 'bg-neon-yellow/20 ring-1 ring-neon-yellow/50' : 'bg-bg-dark/50'}`}>
                        <p className="text-white/40 text-xs mb-1">Hit %</p>
                        <p className={`font-bold text-lg ${hasBestAccuracy ? 'text-neon-yellow' : 'text-white'}`}>
                          {stats.hitAccuracy.toFixed(0)}%
                        </p>
                        {hasBestAccuracy && <p className="text-neon-yellow text-xs">Best!</p>}
                      </div>
                      <div className={`rounded-lg p-3 text-center ${hasBestRound ? 'bg-neon-blue/20 ring-1 ring-neon-blue/50' : 'bg-bg-dark/50'}`}>
                        <p className="text-white/40 text-xs mb-1">Best Rnd</p>
                        <p className={`font-bold text-lg ${hasBestRound ? 'text-neon-blue' : 'text-white'}`}>
                          {stats.bestRound}
                        </p>
                        {hasBestRound && stats.bestRound === 9 && <p className="text-neon-blue text-xs">Perfect!</p>}
                      </div>
                      <div className="bg-bg-dark/50 rounded-lg p-3 text-center">
                        <p className="text-white/40 text-xs mb-1">Triples</p>
                        <p className="text-white font-bold text-lg">{stats.tripleRate.toFixed(0)}%</p>
                      </div>
                      <div className="bg-bg-dark/50 rounded-lg p-3 text-center">
                        <p className="text-white/40 text-xs mb-1">Darts</p>
                        <p className="text-white font-bold text-lg">{stats.dartsThrown}</p>
                      </div>
                    </div>

                    {/* Extra Cricket stats row */}
                    <div className="flex items-center justify-center gap-6 mt-3 text-sm">
                      {stats.whiteHorses > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-neon-yellow">🐴</span>
                          <span className="text-white/60">{stats.whiteHorses} White Horse{stats.whiteHorses !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {stats.hatTricks > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-neon-red">🎩</span>
                          <span className="text-white/60">{stats.hatTricks} Hat Trick{stats.hatTricks !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {stats.totalPoints > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-neon-green">Pts</span>
                          <span className="text-white/60">{stats.totalPoints}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-white/40">Wasted</span>
                        <span className="text-white/60">{stats.wastedDarts}</span>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // X01 Statistics
                const stats = gameStats.playerStats[player.id];
                const hasBestAverage = stats.averagePerTurn === bestStats.average;
                const hasBestHighest = stats.highestTurn === bestStats.highest;
                const hasBestCheckout = stats.highestCheckout === bestStats.checkout && bestStats.checkout > 0;

                return (
                  <div
                    key={player.id}
                    className={`rounded-xl p-4 ${
                      isWinner
                        ? 'bg-gradient-to-r from-neon-green/15 to-neon-blue/10 ring-1 ring-neon-green/30'
                        : 'bg-bg-elevated/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-dark/50 text-white/60 font-bold">
                        {idx + 1}
                      </div>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.type === 'ai' ? '🤖' : player.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{player.name}</p>
                        <p className="text-white/40 text-sm">
                          {gameState.legsWon[player.id]} leg{gameState.legsWon[player.id] !== 1 ? 's' : ''} won
                        </p>
                      </div>
                      {isWinner && <span className="text-3xl">👑</span>}
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      <div className="bg-bg-dark/50 rounded-lg p-3 text-center">
                        <p className="text-white/40 text-xs mb-1">Darts</p>
                        <p className="text-white font-bold text-lg">{stats.dartsThrown}</p>
                      </div>
                      <div className={`rounded-lg p-3 text-center ${hasBestAverage ? 'bg-neon-green/20 ring-1 ring-neon-green/50' : 'bg-bg-dark/50'}`}>
                        <p className="text-white/40 text-xs mb-1">Average</p>
                        <p className={`font-bold text-lg ${hasBestAverage ? 'text-neon-green' : 'text-white'}`}>
                          {stats.averagePerTurn.toFixed(1)}
                        </p>
                        {hasBestAverage && <p className="text-neon-green text-xs">Best!</p>}
                      </div>
                      <div className={`rounded-lg p-3 text-center ${hasBestHighest ? 'bg-neon-yellow/20 ring-1 ring-neon-yellow/50' : 'bg-bg-dark/50'}`}>
                        <p className="text-white/40 text-xs mb-1">Highest</p>
                        <p className={`font-bold text-lg ${hasBestHighest ? 'text-neon-yellow' : 'text-white'}`}>
                          {stats.highestTurn}
                        </p>
                        {hasBestHighest && stats.highestTurn === 180 && <p className="text-neon-yellow text-xs">180!</p>}
                      </div>
                      <div className={`rounded-lg p-3 text-center ${hasBestCheckout ? 'bg-neon-blue/20 ring-1 ring-neon-blue/50' : 'bg-bg-dark/50'}`}>
                        <p className="text-white/40 text-xs mb-1">Best CO</p>
                        <p className={`font-bold text-lg ${hasBestCheckout ? 'text-neon-blue' : 'text-white'}`}>
                          {stats.highestCheckout || '-'}
                        </p>
                        {hasBestCheckout && <p className="text-neon-blue text-xs">Best!</p>}
                      </div>
                      <div className="bg-bg-dark/50 rounded-lg p-3 text-center">
                        <p className="text-white/40 text-xs mb-1">Triples</p>
                        <p className="text-white font-bold text-lg">{stats.triplesHit}</p>
                      </div>
                      <div className="bg-bg-dark/50 rounded-lg p-3 text-center">
                        <p className="text-white/40 text-xs mb-1">Doubles</p>
                        <p className="text-white font-bold text-lg">{stats.doublesHit}</p>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>

        {/* Leg Breakdown */}
        <div className="bg-bg-card rounded-2xl p-6 mb-6 shadow-xl border border-white/5">
          <h2 className="text-white/60 text-sm font-medium mb-4">Leg Breakdown</h2>
          <div className="flex items-center justify-center gap-2">
            {gameState.legs.map((leg, idx) => {
              const legWinner = gameState.players.find(p => p.id === leg.winnerId);
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: legWinner?.color || '#333' }}
                  >
                    {leg.winnerId ? (legWinner?.type === 'ai' ? '🤖' : legWinner?.name[0]) : '?'}
                  </div>
                  <span className="text-white/40 text-xs">L{idx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onRematch}
            className="flex-1 py-5 bg-gradient-to-r from-neon-yellow to-orange-500 rounded-2xl text-black font-bold text-xl hover:opacity-90 transition-all shadow-xl shadow-neon-yellow/30 flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Rematch
          </button>
          <button
            onClick={onFinish}
            className="flex-1 py-5 bg-gradient-to-r from-neon-green via-neon-blue to-neon-green rounded-2xl text-black font-bold text-xl hover:opacity-90 transition-all shadow-xl shadow-neon-green/30 flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameWinnerScreen;
