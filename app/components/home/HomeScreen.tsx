'use client';

import React, { useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { useGameStore } from '../../stores/gameStore';
import { GameHistory } from '../../types';
import GameDetailModal from './GameDetailModal';

interface HomeScreenProps {
  onNewGame: () => void;
  onContinueGame: () => void;
  onViewHistory: () => void;
  onViewProfile: () => void;
  onOpenSettings: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onNewGame,
  onContinueGame,
  onViewHistory,
  onViewProfile,
  onOpenSettings,
}) => {
  const { users, gameHistory } = useUserStore();
  const { savedGameState, loadSavedGame } = useGameStore();
  const [selectedGame, setSelectedGame] = useState<GameHistory | null>(null);
  
  const hasSavedGame = savedGameState !== null;
  
  const handleContinueGame = () => {
    loadSavedGame();
    onContinueGame();
  };

  // Get some quick stats
  const totalGames = gameHistory.length;
  const recentGames = gameHistory.slice(-3).reverse();

  return (
    <div className="min-h-screen h-screen overflow-y-auto p-6 pb-12">
      {/* Header */}
      <div className="text-center mb-6 pt-4">
        <h1 className="text-4xl font-bold text-white mb-1">Darts Scorer</h1>
        <p className="text-white/60 text-sm">Track your games like a pro</p>
      </div>

      {/* Main Actions */}
      <div className="max-w-md mx-auto space-y-3 mb-6">
        <button
          onClick={onNewGame}
          className="w-full py-5 bg-gradient-to-r from-neon-green to-neon-blue rounded-2xl text-black font-bold text-xl hover:opacity-90 transition-all shadow-lg shadow-neon-green/20 flex items-center justify-center gap-3"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          New Game
        </button>

        {/* Continue Saved Game */}
        {hasSavedGame && savedGameState && (
          <button
            onClick={handleContinueGame}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl text-black font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div className="flex flex-col items-start">
              <span>Continue Game</span>
              <span className="text-xs font-normal opacity-70">
                {savedGameState.rules.gameType === 'cricket' ? 'Cricket' : savedGameState.rules.gameType} • 
                Leg {savedGameState.currentLegIndex + 1} • 
                {savedGameState.players.map(p => p.name).join(' vs ')}
              </span>
            </div>
          </button>
        )}

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onViewHistory}
            className="py-4 bg-bg-card hover:bg-bg-elevated rounded-xl text-white font-medium transition-all flex flex-col items-center gap-2"
          >
            <svg className="w-6 h-6 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            History
          </button>
          <button
            onClick={onViewProfile}
            className="py-4 bg-bg-card hover:bg-bg-elevated rounded-xl text-white font-medium transition-all flex flex-col items-center gap-2"
          >
            <svg className="w-6 h-6 text-neon-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </button>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full py-3 bg-bg-card hover:bg-bg-elevated rounded-xl text-white/60 hover:text-white font-medium transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>

      {/* Quick Stats */}
      {totalGames > 0 && (
        <div className="max-w-md mx-auto">
          <h2 className="text-white/60 text-sm mb-2">Recent Activity</h2>
          <div className="bg-bg-card rounded-xl p-3">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
              <span className="text-white/60 text-sm">Total Games Played</span>
              <span className="text-xl font-bold text-neon-green">{totalGames}</span>
            </div>

            {recentGames.length > 0 && (
              <div className="space-y-1">
                <p className="text-white/40 text-xs">Recent Games</p>
                {recentGames.map(game => {
                  const winner = game.players.find(p => p.id === game.winnerId);
                  const date = new Date(game.completedAt).toLocaleDateString();
                  
                  return (
                    <button
                      key={game.id}
                      onClick={() => setSelectedGame(game)}
                      className="w-full flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">
                          {game.gameType === 'cricket' ? 'Cricket' : game.gameType}
                        </span>
                        <span className="text-white/40 text-xs">
                          vs {game.players.length - 1} player(s)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-white/60 text-sm">{winner?.name || 'No winner'}</p>
                          <p className="text-white/40 text-xs">{date}</p>
                        </div>
                        <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Overview */}
      {users.length > 0 && (
        <div className="max-w-md mx-auto mt-4">
          <h2 className="text-white/60 text-sm mb-2">Registered Players</h2>
          <div className="flex flex-wrap gap-2">
            {users.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-card rounded-lg"
              >
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: user.avatarColor }}
                />
                <span className="text-white text-sm">{user.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Detail Modal */}
      {selectedGame && (
        <GameDetailModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
};

export default HomeScreen;
