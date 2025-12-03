'use client';

import React from 'react';
import { GameHistory } from '../../types';

interface GameDetailModalProps {
  game: GameHistory;
  onClose: () => void;
}

const GameDetailModal: React.FC<GameDetailModalProps> = ({ game, onClose }) => {
  const winner = game.players.find(p => p.id === game.winnerId);
  const isCricket = game.gameType === 'cricket';
  
  // Calculate game duration
  const startTime = new Date(game.startedAt).getTime();
  const endTime = new Date(game.completedAt).getTime();
  const durationMs = endTime - startTime;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);

  // Sort players by legs won
  const sortedPlayers = [...game.players].sort((a, b) => {
    const legsA = game.legsWon[a.id] || 0;
    const legsB = game.legsWon[b.id] || 0;
    return legsB - legsA;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-bg-card to-bg-elevated rounded-2xl p-4 max-w-lg w-full animate-fade-in shadow-2xl border border-white/10 my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isCricket ? 'Cricket' : game.gameType} Game
            </h2>
            <p className="text-white/40 text-sm">
              {new Date(game.completedAt).toLocaleDateString()} • {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Winner Banner */}
        {winner && (
          <div className="bg-gradient-to-r from-neon-green/20 to-neon-blue/10 rounded-xl p-3 mb-4 flex items-center gap-3">
            <div className="text-3xl">🏆</div>
            <div>
              <p className="text-white/60 text-xs">Winner</p>
              <p className="text-white font-bold text-lg">{winner.name}</p>
            </div>
          </div>
        )}

        {/* Final Score */}
        <div className="bg-bg-dark/50 rounded-xl p-3 mb-4">
          <p className="text-white/40 text-xs mb-2 text-center">Final Score</p>
          <div className="flex items-center justify-center gap-4">
            {game.players.map((player, idx) => (
              <React.Fragment key={player.id}>
                {idx > 0 && <span className="text-white/30 text-xl">-</span>}
                <div className="text-center">
                  <p className="text-white text-sm mb-1">{player.name}</p>
                  <p className={`text-2xl font-bold ${player.id === game.winnerId ? 'text-neon-green' : 'text-white/60'}`}>
                    {game.legsWon[player.id] || 0}
                  </p>
                </div>
              </React.Fragment>
            ))}
          </div>
          <p className="text-white/30 text-xs text-center mt-2">
            Best of {game.rules.bestOf}
            {!isCricket && game.rules.doubleOut && ' • Double Out'}
            {isCricket && game.rules.cricketVariant && ` • ${game.rules.cricketVariant}`}
          </p>
        </div>

        {/* Player Statistics */}
        <div className="space-y-3 mb-4">
          <p className="text-white/40 text-xs">Player Statistics</p>
          {sortedPlayers.map((player) => {
            const isWinner = player.id === game.winnerId;

            if (isCricket && game.statistics.cricketStats) {
              const stats = game.statistics.cricketStats[player.id];
              if (!stats) return null;

              return (
                <div
                  key={player.id}
                  className={`rounded-xl p-3 ${isWinner ? 'bg-neon-green/10 ring-1 ring-neon-green/30' : 'bg-bg-dark/50'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{player.name}</span>
                      {isWinner && <span className="text-neon-green text-xs">Winner</span>}
                    </div>
                    <span className="text-white/40 text-xs">{game.legsWon[player.id]} legs</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-bg-elevated/50 rounded p-1.5">
                      <p className="text-white/40 text-[10px]">MPR</p>
                      <p className="text-white font-bold text-sm">{stats.marksPerRound.toFixed(2)}</p>
                    </div>
                    <div className="bg-bg-elevated/50 rounded p-1.5">
                      <p className="text-white/40 text-[10px]">Marks</p>
                      <p className="text-white font-bold text-sm">{stats.totalMarks}</p>
                    </div>
                    <div className="bg-bg-elevated/50 rounded p-1.5">
                      <p className="text-white/40 text-[10px]">Hit %</p>
                      <p className="text-white font-bold text-sm">{stats.hitAccuracy.toFixed(0)}%</p>
                    </div>
                    <div className="bg-bg-elevated/50 rounded p-1.5">
                      <p className="text-white/40 text-[10px]">Darts</p>
                      <p className="text-white font-bold text-sm">{stats.dartsThrown}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs text-white/50">
                    <span>T: {stats.tripleRate.toFixed(0)}%</span>
                    <span>D: {stats.doubleRate.toFixed(0)}%</span>
                    {stats.totalPoints > 0 && <span>Pts: {stats.totalPoints}</span>}
                  </div>
                </div>
              );
            } else {
              const stats = game.statistics.playerStats[player.id];
              if (!stats) return null;

              return (
                <div
                  key={player.id}
                  className={`rounded-xl p-3 ${isWinner ? 'bg-neon-green/10 ring-1 ring-neon-green/30' : 'bg-bg-dark/50'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{player.name}</span>
                      {isWinner && <span className="text-neon-green text-xs">Winner</span>}
                    </div>
                    <span className="text-white/40 text-xs">{game.legsWon[player.id]} legs</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-bg-elevated/50 rounded p-1.5">
                      <p className="text-white/40 text-[10px]">Average</p>
                      <p className="text-white font-bold text-sm">{stats.averagePerTurn.toFixed(1)}</p>
                    </div>
                    <div className="bg-bg-elevated/50 rounded p-1.5">
                      <p className="text-white/40 text-[10px]">Highest</p>
                      <p className="text-white font-bold text-sm">{stats.highestTurn}</p>
                    </div>
                    <div className="bg-bg-elevated/50 rounded p-1.5">
                      <p className="text-white/40 text-[10px]">Best CO</p>
                      <p className="text-white font-bold text-sm">{stats.highestCheckout || '-'}</p>
                    </div>
                    <div className="bg-bg-elevated/50 rounded p-1.5">
                      <p className="text-white/40 text-[10px]">Darts</p>
                      <p className="text-white font-bold text-sm">{stats.dartsThrown}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs text-white/50">
                    <span>Triples: {stats.triplesHit}</span>
                    <span>Doubles: {stats.doublesHit}</span>
                  </div>
                </div>
              );
            }
          })}
        </div>

        {/* Leg Breakdown */}
        <div className="mb-4">
          <p className="text-white/40 text-xs mb-2">Leg Breakdown</p>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {game.legs.map((leg, idx) => {
              const legWinner = game.players.find(p => p.id === leg.winnerId);
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center"
                  title={legWinner?.name || 'Unknown'}
                >
                  <div className="w-8 h-8 rounded bg-bg-dark/50 flex items-center justify-center text-white text-xs font-bold">
                    {leg.winnerId ? legWinner?.name?.[0] || '?' : '-'}
                  </div>
                  <span className="text-white/30 text-[10px]">L{idx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-bg-elevated hover:bg-white/10 rounded-xl text-white font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default GameDetailModal;


