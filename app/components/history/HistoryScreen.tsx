'use client';

import React, { useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { GameHistory, GameType } from '../../types';

interface HistoryScreenProps {
  onBack: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const { gameHistory, deleteGameHistory } = useUserStore();
  const [filterType, setFilterType] = useState<GameType | 'all'>('all');
  const [selectedGame, setSelectedGame] = useState<GameHistory | null>(null);
  const [gameToDelete, setGameToDelete] = useState<GameHistory | null>(null);

  // Filter and sort games
  const filteredGames = gameHistory
    .filter(game => filterType === 'all' || game.gameType === filterType)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-bg-elevated rounded-lg transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-white">Game History</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', '501', '301', 'cricket'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              filterType === type
                ? 'bg-neon-green text-black'
                : 'bg-bg-card text-white/60 hover:text-white'
            }`}
          >
            {type === 'all' ? 'All Games' : type === 'cricket' ? 'Cricket' : type}
          </button>
        ))}
      </div>

      {/* Games List */}
      {filteredGames.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-white/60">No games found</p>
          <p className="text-white/40 text-sm mt-2">Play some games to see your history here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGames.map(game => {
            const winner = game.players.find(p => p.id === game.winnerId);
            const playerCount = game.players.length;

            return (
              <div
                key={game.id}
                className="p-4 bg-bg-card hover:bg-bg-elevated rounded-xl transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Game info - clickable */}
                  <button
                    onClick={() => setSelectedGame(game)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-bold text-white">
                        {game.gameType === 'cricket' ? 'Cricket' : game.gameType}
                      </span>
                      <span className="text-white/40 text-sm">{formatDate(game.completedAt)}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-white/60 text-sm">{playerCount} players</span>
                      <span className="text-white/40">•</span>
                      <span className="text-white/60 text-sm">Best of {game.rules.bestOf}</span>
                      {winner && (
                        <>
                          <span className="text-white/40">•</span>
                          <span className="text-neon-green text-sm">🏆 {winner.name}</span>
                        </>
                      )}
                    </div>
                  </button>
                  {/* Delete button - centered vertically and icon centered in button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGameToDelete(game);
                    }}
                    className="w-9 h-9 flex items-center justify-center hover:bg-red-500/20 rounded-lg text-white/30 hover:text-red-400 transition-all flex-shrink-0"
                    title="Delete game"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Game Detail Modal */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-bg-card rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {selectedGame.gameType === 'cricket' ? 'Cricket' : selectedGame.gameType} Game
              </h2>
              <button
                onClick={() => setSelectedGame(null)}
                className="p-2 hover:bg-bg-elevated rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-white/60 text-sm mb-4">{formatDate(selectedGame.completedAt)}</p>

            {/* Final Standings */}
            <div className="bg-bg-elevated rounded-xl p-4 mb-4">
              <h3 className="text-white/60 text-sm mb-3">Final Standings</h3>
              <div className="space-y-3">
                {selectedGame.players
                  .sort((a, b) => (selectedGame.legsWon[b.id] || 0) - (selectedGame.legsWon[a.id] || 0))
                  .map((player, index) => {
                    const isWinner = player.id === selectedGame.winnerId;

                    return (
                      <div key={player.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-bold ${isWinner ? 'text-neon-yellow' : 'text-white/40'}`}>
                            {index + 1}.
                          </span>
                          <span className={`font-medium ${isWinner ? 'text-white' : 'text-white/60'}`}>
                            {player.name}
                          </span>
                          {isWinner && <span className="text-neon-yellow">🏆</span>}
                        </div>
                        <span className="text-neon-green font-bold">
                          {selectedGame.legsWon[player.id] || 0} legs
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Player Statistics */}
            <h3 className="text-white/60 text-sm mb-3">Player Statistics</h3>
            <div className="space-y-3">
              {selectedGame.players.map(player => {
                const stats = selectedGame.statistics.playerStats[player.id];
                if (!stats) return null;

                return (
                  <div key={player.id} className="bg-bg-elevated rounded-xl p-4">
                    <p className="text-white font-medium mb-3">{player.name}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-white/40">Darts Thrown</p>
                        <p className="text-white font-medium">{stats.dartsThrown}</p>
                      </div>
                      <div>
                        <p className="text-white/40">Average (3 darts)</p>
                        <p className="text-white font-medium">{stats.averagePerTurn.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-white/40">Highest Turn</p>
                        <p className="text-white font-medium">{stats.highestTurn}</p>
                      </div>
                      <div>
                        <p className="text-white/40">Highest Checkout</p>
                        <p className="text-white font-medium">{stats.highestCheckout || '-'}</p>
                      </div>
                      <div>
                        <p className="text-white/40">Doubles Hit</p>
                        <p className="text-white font-medium">{stats.doublesHit}</p>
                      </div>
                      <div>
                        <p className="text-white/40">Triples Hit</p>
                        <p className="text-white font-medium">{stats.triplesHit}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setSelectedGame(null)}
              className="w-full mt-4 py-3 bg-bg-elevated rounded-xl text-white font-medium hover:bg-bg-elevated/80 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {gameToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-bg-card rounded-2xl p-6 max-w-sm w-full animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete Game?</h2>
              <p className="text-white/60 text-sm">
                Are you sure you want to delete this {gameToDelete.gameType === 'cricket' ? 'Cricket' : gameToDelete.gameType} game 
                from {formatDate(gameToDelete.completedAt)}?
              </p>
              <p className="text-white/40 text-xs mt-2">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setGameToDelete(null)}
                className="flex-1 py-3 bg-bg-elevated rounded-xl text-white font-medium hover:bg-bg-elevated/80 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteGameHistory(gameToDelete.id);
                  setGameToDelete(null);
                }}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-bold transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryScreen;
