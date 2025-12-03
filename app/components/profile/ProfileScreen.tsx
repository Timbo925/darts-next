'use client';

import React, { useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { UserAccount, GameHistory } from '../../types';

interface ProfileScreenProps {
  onBack: () => void;
}

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
];

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const { users, gameHistory, createUser, deleteUser, getUserStatistics } = useUserStore();
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserColor, setNewUserColor] = useState(AVATAR_COLORS[0]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');

  const handleCreateUser = () => {
    if (newUsername.trim()) {
      createUser(newUsername.trim(), newUserColor);
      setNewUsername('');
      setShowCreateForm(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    deleteUser(userId);
    setShowDeleteConfirm(null);
    if (selectedUser?.id === userId) {
      setSelectedUser(null);
    }
  };

  // Get games for a specific user
  const getUserGames = (userId: string): GameHistory[] => {
    return gameHistory
      .filter(g => g.players.some(p => p.userId === userId))
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
        <h1 className="text-2xl font-bold text-white">Player Profiles</h1>
      </div>

      {/* User List */}
      <div className="max-w-4xl mx-auto">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👤</div>
            <p className="text-white/60">No players yet</p>
            <p className="text-white/40 text-sm mt-2">Create a player profile to track your stats!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* User List Panel */}
            <div className="space-y-3">
              <h2 className="text-white/60 text-sm mb-2">Players</h2>
              {users.map(user => {
                const stats = getUserStatistics(user.id);
                const isSelected = selectedUser?.id === user.id;

                return (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(isSelected ? null : user)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-neon-green/20 to-neon-blue/20 ring-2 ring-neon-green'
                        : 'bg-bg-card hover:bg-bg-elevated'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                        style={{ backgroundColor: user.avatarColor }}
                      >
                        {user.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-lg">{user.username}</p>
                        <p className="text-white/40 text-sm">
                          {stats.gamesPlayed} games • {stats.winRate.toFixed(0)}% wins
                        </p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-white/40 transition-transform ${isSelected ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}

              {/* Create New User */}
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full py-4 bg-gradient-to-r from-neon-green/20 to-neon-blue/20 border-2 border-dashed border-neon-green/50 rounded-xl text-neon-green font-medium hover:border-neon-green transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Player
                </button>
              ) : (
                <div className="bg-bg-card rounded-xl p-4 animate-fade-in">
                  <h3 className="text-white font-medium mb-4">Create New Player</h3>

                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full p-3 bg-bg-elevated rounded-lg text-white placeholder-white/40 mb-4 focus:outline-none focus:ring-2 focus:ring-neon-green"
                    autoFocus
                  />

                  <p className="text-white/60 text-sm mb-2">Choose avatar color</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {AVATAR_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewUserColor(color)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          newUserColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-card' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 py-3 bg-bg-elevated rounded-lg text-white/60 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateUser}
                      disabled={!newUsername.trim()}
                      className="flex-1 py-3 bg-neon-green rounded-lg text-black font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selected User Detail Panel */}
            {selectedUser && (
              <div className="bg-bg-card rounded-xl p-4 animate-fade-in">
                {/* User Header */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                    style={{ backgroundColor: selectedUser.avatarColor }}
                  >
                    {selectedUser.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white">{selectedUser.username}</h2>
                    <p className="text-white/40 text-sm">
                      Member since {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(selectedUser.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete Profile"
                  >
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                      activeTab === 'stats'
                        ? 'bg-neon-green text-black'
                        : 'bg-bg-elevated text-white/60 hover:text-white'
                    }`}
                  >
                    Statistics
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                      activeTab === 'history'
                        ? 'bg-neon-green text-black'
                        : 'bg-bg-elevated text-white/60 hover:text-white'
                    }`}
                  >
                    Game History
                  </button>
                </div>

                {/* Stats Tab */}
                {activeTab === 'stats' && (
                  <div className="space-y-4">
                    {(() => {
                      const stats = getUserStatistics(selectedUser.id);
                      return (
                        <>
                          {/* Quick Stats Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-bg-elevated rounded-lg p-3">
                              <p className="text-white/40 text-xs">Games Played</p>
                              <p className="text-2xl font-bold text-white">{stats.gamesPlayed}</p>
                            </div>
                            <div className="bg-bg-elevated rounded-lg p-3">
                              <p className="text-white/40 text-xs">Games Won</p>
                              <p className="text-2xl font-bold text-neon-green">{stats.gamesWon}</p>
                            </div>
                            <div className="bg-bg-elevated rounded-lg p-3">
                              <p className="text-white/40 text-xs">Win Rate</p>
                              <p className="text-2xl font-bold text-white">{stats.winRate.toFixed(1)}%</p>
                            </div>
                            <div className="bg-bg-elevated rounded-lg p-3">
                              <p className="text-white/40 text-xs">Avg (3 darts)</p>
                              <p className="text-2xl font-bold text-white">
                                {stats.overallAveragePerTurn.toFixed(1)}
                              </p>
                            </div>
                            <div className="bg-bg-elevated rounded-lg p-3">
                              <p className="text-white/40 text-xs">Highest Checkout</p>
                              <p className="text-2xl font-bold text-neon-yellow">
                                {stats.highestCheckout || '-'}
                              </p>
                            </div>
                            <div className="bg-bg-elevated rounded-lg p-3">
                              <p className="text-white/40 text-xs">Total Darts</p>
                              <p className="text-2xl font-bold text-white">{stats.totalDartsThrown}</p>
                            </div>
                          </div>

                          {/* Game Type Breakdown */}
                          {stats.gamesPlayed > 0 && (
                            <div className="bg-bg-elevated rounded-lg p-4">
                              <p className="text-white/60 text-sm mb-3">By Game Type</p>
                              <div className="space-y-2">
                                {(['501', '301', 'cricket'] as const).map(type => {
                                  const typeStats = stats.gameTypeStats[type];
                                  if (typeStats.played === 0) return null;
                                  const winRate = typeStats.played > 0 
                                    ? (typeStats.won / typeStats.played * 100).toFixed(0) 
                                    : '0';

                                  return (
                                    <div key={type} className="flex items-center justify-between">
                                      <span className="text-white font-medium">
                                        {type === 'cricket' ? 'Cricket' : type}
                                      </span>
                                      <div className="text-right">
                                        <span className="text-neon-green">{typeStats.won}</span>
                                        <span className="text-white/40">/{typeStats.played}</span>
                                        <span className="text-white/40 text-sm ml-2">({winRate}%)</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {(() => {
                      const userGames = getUserGames(selectedUser.id);
                      
                      if (userGames.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <p className="text-white/40">No games played yet</p>
                          </div>
                        );
                      }

                      return userGames.map(game => {
                        const userPlayer = game.players.find(p => p.userId === selectedUser.id);
                        const isWinner = game.winnerId === userPlayer?.id;
                        const playerStats = userPlayer ? game.statistics.playerStats[userPlayer.id] : null;
                        const opponents = game.players.filter(p => p.userId !== selectedUser.id);

                        return (
                          <div
                            key={game.id}
                            className={`p-3 rounded-lg ${isWinner ? 'bg-neon-green/10 border border-neon-green/30' : 'bg-bg-elevated'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">
                                  {game.gameType === 'cricket' ? 'Cricket' : game.gameType}
                                </span>
                                {isWinner && (
                                  <span className="text-neon-yellow text-sm">🏆 Won</span>
                                )}
                              </div>
                              <span className="text-white/40 text-xs">{formatDate(game.completedAt)}</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="text-white/60">
                                vs {opponents.map(p => p.name).join(', ')}
                              </div>
                              {playerStats && (
                                <div className="text-white/40">
                                  Avg: {playerStats.averagePerTurn.toFixed(1)}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                              <span>Legs: {game.legsWon[userPlayer?.id || ''] || 0}</span>
                              {playerStats && (
                                <>
                                  <span>Darts: {playerStats.dartsThrown}</span>
                                  {playerStats.highestCheckout > 0 && (
                                    <span className="text-neon-yellow">
                                      Checkout: {playerStats.highestCheckout}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Empty state when no user selected */}
            {!selectedUser && users.length > 0 && (
              <div className="bg-bg-card rounded-xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-white/40">Select a player to view details</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-bg-card rounded-2xl p-6 max-w-sm w-full animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-2">Delete Profile?</h2>
            <p className="text-white/60 mb-6">
              This will permanently delete this player profile. Game history will be preserved but won&apos;t be linked to this player.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 bg-bg-elevated rounded-xl text-white font-medium hover:bg-bg-elevated/80 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="flex-1 py-3 bg-red-500 rounded-xl text-white font-bold hover:bg-red-600 transition-all"
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

export default ProfileScreen;
