'use client';

import React from 'react';
import { Player, CricketScore, DartThrow, CricketVariant } from '../../types';

interface CricketScoreboardProps {
  players: Player[];
  scores: Record<string, CricketScore>;
  currentPlayerId: string;
  currentThrowInTurn: number;
  recentThrows: DartThrow[];
  variant: CricketVariant;
  legsWon: Record<string, number>;
}

const CRICKET_NUMBERS = [20, 19, 18, 17, 16, 15, 25];

const CricketScoreboard: React.FC<CricketScoreboardProps> = ({
  players,
  scores,
  currentPlayerId,
  currentThrowInTurn,
  recentThrows,
  variant,
  legsWon,
}) => {
  // Render marks (/, X, or closed checkmark)
  const renderMarks = (marks: number, closed: boolean) => {
    if (closed) {
      return (
        <div className="w-6 h-6 rounded-full bg-neon-green flex items-center justify-center">
          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }

    return (
      <div className="w-6 h-6 flex items-center justify-center text-white font-bold text-sm">
        {marks === 0 && <span className="text-white/20">-</span>}
        {marks === 1 && <span>/</span>}
        {marks === 2 && <span>X</span>}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Cricket Grid */}
      <div className="bg-bg-elevated rounded-xl overflow-hidden text-sm">
        {/* Header */}
        <div className="grid" style={{ gridTemplateColumns: `60px repeat(${players.length}, 1fr)` }}>
          <div className="p-2 bg-bg-dark border-b border-white/10" />
          {players.map(player => {
            const isCurrentPlayer = player.id === currentPlayerId;
            return (
              <div
                key={player.id}
                className={`p-2 text-center border-b border-l border-white/10 ${
                  isCurrentPlayer ? 'bg-neon-green/10' : 'bg-bg-dark'
                }`}
              >
                <div
                  className="w-6 h-6 mx-auto rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: player.color }}
                >
                  {player.type === 'ai' ? '🤖' : player.name[0]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Number Rows */}
        {CRICKET_NUMBERS.map(num => (
          <div
            key={num}
            className="grid border-b border-white/10"
            style={{ gridTemplateColumns: `60px repeat(${players.length}, 1fr)` }}
          >
            <div className="p-2 flex items-center justify-center bg-bg-dark/50">
              <span className="text-white font-bold">
                {num === 25 ? 'Bull' : num}
              </span>
            </div>
            {players.map(player => {
              const playerScore = scores[player.id];
              const mark = playerScore?.marks.find(m => m.number === num);
              const isCurrentPlayer = player.id === currentPlayerId;

              return (
                <div
                  key={player.id}
                  className={`p-2 flex items-center justify-center border-l border-white/10 ${
                    isCurrentPlayer ? 'bg-neon-green/5' : ''
                  }`}
                >
                  {renderMarks(mark?.marks || 0, mark?.closed || false)}
                </div>
              );
            })}
          </div>
        ))}

        {/* Points Row (for standard and cutthroat) */}
        {variant !== 'no-score' && (
          <div
            className="grid bg-bg-dark"
            style={{ gridTemplateColumns: `60px repeat(${players.length}, 1fr)` }}
          >
            <div className="p-2 flex items-center justify-center">
              <span className="text-white/60 text-xs">Pts</span>
            </div>
            {players.map(player => {
              const playerScore = scores[player.id];
              const isCurrentPlayer = player.id === currentPlayerId;

              return (
                <div
                  key={player.id}
                  className={`p-2 text-center border-l border-white/10 ${
                    isCurrentPlayer ? 'bg-neon-green/10' : ''
                  }`}
                >
                  <span className={`text-lg font-bold ${
                    variant === 'cutthroat' ? 'text-neon-red' : 'text-neon-green'
                  }`}>
                    {playerScore?.points || 0}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legs Won */}
      <div className="bg-bg-elevated rounded-xl p-3">
        <p className="text-white/40 text-xs mb-2 text-center">Legs Won</p>
        <div className="flex justify-center gap-4">
          {players.map(player => {
            const isCurrentPlayer = player.id === currentPlayerId;
            const legs = legsWon[player.id] || 0;

            return (
              <div
                key={player.id}
                className="flex items-center gap-2"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: player.color }}
                >
                  {player.type === 'ai' ? '🤖' : player.name[0]}
                </div>
                <div className={`px-3 py-1 rounded-lg ${
                  isCurrentPlayer
                    ? 'bg-neon-green/20 ring-1 ring-neon-green'
                    : 'bg-bg-dark'
                }`}>
                  <span className={`text-xl font-bold ${legs > 0 ? 'text-neon-yellow' : 'text-white/40'}`}>
                    {legs}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Variant Info */}
      <div className="text-center text-white/40 text-xs">
        {variant === 'standard' && 'Close numbers & score on opponents'}
        {variant === 'cutthroat' && 'Close numbers & keep YOUR score low'}
        {variant === 'no-score' && 'First to close all numbers wins'}
      </div>
    </div>
  );
};

export default CricketScoreboard;
