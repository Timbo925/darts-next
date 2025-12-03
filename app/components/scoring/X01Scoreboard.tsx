'use client';

import React from 'react';
import { Player, X01Score, DartThrow, GameRules } from '../../types';
import { getCheckoutPath, formatCheckoutPath, getValidCheckoutDoubles } from '../../utils/checkout';

interface X01ScoreboardProps {
  players: Player[];
  scores: Record<string, X01Score>;
  currentPlayerId: string;
  currentThrowInTurn: number;
  recentThrows: DartThrow[];
  rules: GameRules;
  legsWon: Record<string, number>;
  preferredDouble: number;
  onPreferredDoubleChange: (double: number) => void;
}

const X01Scoreboard: React.FC<X01ScoreboardProps> = ({
  players,
  scores,
  currentPlayerId,
  currentThrowInTurn,
  recentThrows,
  rules,
  legsWon,
  preferredDouble,
  onPreferredDoubleChange,
}) => {
  const currentScore = scores[currentPlayerId];

  // Calculate checkout path for current player
  const checkoutPath = currentScore && currentScore.remaining <= 170
    ? getCheckoutPath(currentScore.remaining, preferredDouble, 3 - Math.min(currentThrowInTurn, 3))
    : null;

  return (
    <div className="space-y-4">
      {/* Player Scores */}
      <div className="space-y-2">
        {players.map(player => {
          const playerScore = scores[player.id];
          const isCurrentPlayer = player.id === currentPlayerId;

          return (
            <div
              key={player.id}
              className={`p-3 rounded-xl transition-all ${
                isCurrentPlayer
                  ? 'bg-gradient-to-r from-neon-green/20 to-neon-blue/20 ring-2 ring-neon-green'
                  : 'bg-bg-elevated'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.type === 'ai' ? '🤖' : player.name[0].toUpperCase()}
                    </div>
                    {/* Legs won badge */}
                    {(legsWon[player.id] || 0) > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-neon-yellow rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-black">{legsWon[player.id]}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{player.name}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-neon-yellow font-semibold">{legsWon[player.id] || 0}</span>
                        <span className="text-white/40">legs</span>
                      </div>
                      <span className="text-white/20">•</span>
                      <span className="text-white/40">{playerScore?.dartsThrown || 0} darts</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${
                    isCurrentPlayer ? 'text-neon-green' : 'text-white'
                  }`}>
                    {playerScore?.remaining || (rules.gameType === '301' ? 301 : 501)}
                  </p>
                  {playerScore && playerScore.dartsThrown > 0 && (
                    <p className="text-white/40 text-xs">
                      Avg: {(((rules.gameType === '301' ? 301 : 501) - playerScore.remaining) / playerScore.dartsThrown * 3).toFixed(1)}
                    </p>
                  )}
                </div>
              </div>

              {/* Double In indicator */}
              {rules.doubleIn && !playerScore?.hasDoubledIn && (
                <div className="mt-2 px-2 py-1 bg-neon-yellow/20 rounded text-neon-yellow text-xs text-center">
                  Needs Double to Start
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Checkout Calculator */}
      {currentScore && currentScore.remaining <= 170 && currentScore.remaining >= 2 && (
        <div className="bg-gradient-to-r from-neon-yellow/10 to-neon-green/10 rounded-xl p-3 border border-neon-yellow/30">
          <h3 className="text-neon-yellow font-medium text-sm mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Checkout Available!
          </h3>
          
          {checkoutPath?.possible ? (
            <p className="text-white font-medium">
              {formatCheckoutPath(checkoutPath)}
            </p>
          ) : (
            <p className="text-white/60 text-sm">No checkout with {Math.max(0, 3 - currentThrowInTurn)} dart(s)</p>
          )}

          {/* Preferred Double Selector - only show valid doubles for current score */}
          {(() => {
            const validDoubles = getValidCheckoutDoubles(
              currentScore.remaining, 
              3 - Math.min(currentThrowInTurn, 3)
            );
            
            if (validDoubles.length === 0) return null;
            
            return (
              <div className="mt-2">
                <p className="text-white/60 text-xs mb-1">Preferred finish:</p>
                <div className="flex flex-wrap gap-1">
                  {validDoubles.slice(0, 10).map(d => (
                    <button
                      key={d}
                      onClick={() => onPreferredDoubleChange(d)}
                      className={`px-2 py-0.5 text-xs rounded transition-all ${
                        preferredDouble === d
                          ? 'bg-neon-green text-black font-bold'
                          : 'bg-bg-dark text-white/60 hover:text-white'
                      }`}
                    >
                      D{d}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default X01Scoreboard;
