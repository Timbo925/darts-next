'use client';

import React, { useState } from 'react';
import { GameType, GameRules, Player, CricketVariant, UserAccount } from '../../types';
import { useUserStore } from '../../stores/userStore';
import { getDifficultyDescription, getExpectedAverage } from '../../utils/ai/index';

interface GameWizardProps {
  onComplete: (rules: GameRules, players: Player[]) => void;
  onCancel: () => void;
}

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
];

const GameWizard: React.FC<GameWizardProps> = ({ onComplete, onCancel }) => {
  const { users, createUser } = useUserStore();
  const [step, setStep] = useState(1);
  const [gameType, setGameType] = useState<GameType>('501');
  const [doubleIn, setDoubleIn] = useState(false);
  const [doubleOut, setDoubleOut] = useState(true);
  const [cricketVariant, setCricketVariant] = useState<CricketVariant>('standard');
  const [bestOf, setBestOf] = useState(3);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserColor, setNewUserColor] = useState(AVATAR_COLORS[0]);
  const [aiDifficulty, setAiDifficulty] = useState(5);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    if (players.length < 1) return;

    const rules: GameRules = {
      gameType,
      doubleIn,
      doubleOut,
      cricketVariant: gameType === 'cricket' ? cricketVariant : undefined,
      bestOf,
    };

    onComplete(rules, players);
  };

  const addHumanPlayer = (user?: UserAccount) => {
    const color = AVATAR_COLORS[players.length % AVATAR_COLORS.length];
    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: user?.username || `Player ${players.length + 1}`,
      type: 'human',
      userId: user?.id,
      color: user?.avatarColor || color,
    };
    setPlayers([...players, newPlayer]);
  };

  const addAIPlayer = () => {
    const color = AVATAR_COLORS[players.length % AVATAR_COLORS.length];
    const aiNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta', 'Bot Epsilon'];
    const aiIndex = players.filter(p => p.type === 'ai').length;
    
    const newPlayer: Player = {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: aiNames[aiIndex % aiNames.length],
      type: 'ai',
      difficulty: aiDifficulty,
      color,
    };
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const handleCreateUser = () => {
    if (newUsername.trim()) {
      const user = createUser(newUsername.trim(), newUserColor);
      addHumanPlayer(user);
      setNewUsername('');
      setShowCreateUser(false);
    }
  };

  const canProceed = () => {
    if (step === 4) {
      return players.length >= 1;
    }
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-bg-card rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-neon-green/20 to-neon-blue/20 p-6">
          <h1 className="text-2xl font-bold text-white mb-2">New Game Setup</h1>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  s <= step ? 'bg-neon-green' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <p className="text-white/60 mt-2 text-sm">
            Step {step} of 4: {
              step === 1 ? 'Game Type' :
              step === 2 ? 'Rules' :
              step === 3 ? 'Match Format' :
              'Players'
            }
          </p>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
          {/* Step 1: Game Type */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-6">Select Game Type</h2>
              <div className="grid gap-4">
                {(['501', '301', 'cricket'] as GameType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setGameType(type)}
                    className={`p-6 rounded-xl text-left transition-all ${
                      gameType === type
                        ? 'bg-neon-green/20 border-2 border-neon-green'
                        : 'bg-bg-elevated hover:bg-bg-elevated/80 border-2 border-transparent'
                    }`}
                  >
                    <h3 className="text-2xl font-bold text-white">
                      {type === 'cricket' ? 'Cricket' : type}
                    </h3>
                    <p className="text-white/60 mt-1">
                      {type === '501' && 'Classic darts - start at 501, race to zero'}
                      {type === '301' && 'Quick format - start at 301, race to zero'}
                      {type === 'cricket' && 'Close numbers 15-20 and bullseye to win'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Rules */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-6">Game Rules</h2>
              
              {gameType !== 'cricket' ? (
                <div className="space-y-6">
                  <div className="bg-bg-elevated p-4 rounded-xl">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <h3 className="text-white font-medium">Double In</h3>
                        <p className="text-white/60 text-sm">Must hit a double to start scoring</p>
                      </div>
                      <div
                        className={`w-14 h-8 rounded-full transition-colors ${
                          doubleIn ? 'bg-neon-green' : 'bg-gray-600'
                        }`}
                        onClick={() => setDoubleIn(!doubleIn)}
                      >
                        <div
                          className={`w-6 h-6 bg-white rounded-full mt-1 transition-transform ${
                            doubleIn ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </div>
                    </label>
                  </div>

                  <div className="bg-bg-elevated p-4 rounded-xl">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <h3 className="text-white font-medium">Double Out</h3>
                        <p className="text-white/60 text-sm">Must finish on a double</p>
                      </div>
                      <div
                        className={`w-14 h-8 rounded-full transition-colors ${
                          doubleOut ? 'bg-neon-green' : 'bg-gray-600'
                        }`}
                        onClick={() => setDoubleOut(!doubleOut)}
                      >
                        <div
                          className={`w-6 h-6 bg-white rounded-full mt-1 transition-transform ${
                            doubleOut ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-white font-medium mb-2">Cricket Variant</h3>
                  {(['standard', 'cutthroat', 'no-score'] as CricketVariant[]).map(variant => (
                    <button
                      key={variant}
                      onClick={() => setCricketVariant(variant)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        cricketVariant === variant
                          ? 'bg-neon-green/20 border-2 border-neon-green'
                          : 'bg-bg-elevated hover:bg-bg-elevated/80 border-2 border-transparent'
                      }`}
                    >
                      <h4 className="text-white font-medium capitalize">{variant.replace('-', ' ')}</h4>
                      <p className="text-white/60 text-sm">
                        {variant === 'standard' && 'Close numbers and score points on opponents'}
                        {variant === 'cutthroat' && 'Score points against opponents - lowest score wins'}
                        {variant === 'no-score' && 'Simply close all numbers first to win'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Best Of */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-6">Match Format</h2>
              <p className="text-white/60 mb-4">Select the number of legs (best of)</p>
              
              <div className="grid grid-cols-4 gap-3">
                {[1, 3, 5, 7, 9, 11, 13, 15].map(num => (
                  <button
                    key={num}
                    onClick={() => setBestOf(num)}
                    className={`p-4 rounded-xl text-center transition-all ${
                      bestOf === num
                        ? 'bg-neon-green text-black font-bold'
                        : 'bg-bg-elevated hover:bg-bg-elevated/80 text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-bg-elevated rounded-xl">
                <p className="text-white/60 text-center">
                  First to <span className="text-neon-green font-bold">{Math.ceil(bestOf / 2)}</span> legs wins the match
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Players */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-6">Add Players</h2>
              
              {/* Current Players */}
              {players.length > 0 && (
                <div className="space-y-3 mb-6">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.type === 'ai' ? '🤖' : player.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{player.name}</p>
                        <p className="text-white/60 text-sm">
                          {player.type === 'ai' 
                            ? `AI - ${getDifficultyDescription(player.difficulty!)} (Lvl ${player.difficulty})`
                            : player.userId ? 'Registered User' : 'Guest'
                          }
                        </p>
                      </div>
                      <button
                        onClick={() => removePlayer(player.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Player Options */}
              {!showCreateUser ? (
                <div className="space-y-3">
                  {/* Existing Users */}
                  {users.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-white/60 text-sm mb-2">Registered Users</h3>
                      <div className="flex flex-wrap gap-2">
                        {users.map(user => {
                          const alreadyAdded = players.some(p => p.userId === user.id);
                          return (
                            <button
                              key={user.id}
                              onClick={() => !alreadyAdded && addHumanPlayer(user)}
                              disabled={alreadyAdded}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                                alreadyAdded
                                  ? 'bg-bg-elevated/50 text-white/40 cursor-not-allowed'
                                  : 'bg-bg-elevated hover:bg-neon-green/20 text-white'
                              }`}
                            >
                              <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: user.avatarColor }}
                              />
                              {user.username}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => addHumanPlayer()}
                    className="w-full p-4 bg-bg-elevated hover:bg-neon-blue/20 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Add Guest Player
                  </button>

                  <button
                    onClick={() => setShowCreateUser(true)}
                    className="w-full p-4 bg-bg-elevated hover:bg-neon-green/20 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Create New Account
                  </button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-bg-card text-white/40 text-sm">or</span>
                    </div>
                  </div>

                  <div className="bg-bg-elevated p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium">AI Difficulty</span>
                      <span className="text-neon-green font-bold">{aiDifficulty}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
                    />
                    <div className="flex justify-between mt-2 text-xs text-white/40">
                      <span>Beginner</span>
                      <span>~{getExpectedAverage(aiDifficulty)} avg</span>
                      <span>Pro</span>
                    </div>
                  </div>

                  <button
                    onClick={addAIPlayer}
                    className="w-full p-4 bg-bg-elevated hover:bg-neon-yellow/20 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">🤖</span>
                    Add AI Bot (Level {aiDifficulty})
                  </button>
                </div>
              ) : (
                /* Create User Form */
                <div className="bg-bg-elevated p-4 rounded-xl animate-fade-in">
                  <h3 className="text-white font-medium mb-4">Create New Account</h3>
                  
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full p-3 bg-bg-dark rounded-lg text-white placeholder-white/40 mb-4 focus:outline-none focus:ring-2 focus:ring-neon-green"
                    autoFocus
                  />

                  <p className="text-white/60 text-sm mb-2">Choose avatar color</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {AVATAR_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewUserColor(color)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          newUserColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-elevated' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreateUser(false)}
                      className="flex-1 p-3 bg-bg-dark hover:bg-bg-dark/80 rounded-lg text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateUser}
                      disabled={!newUsername.trim()}
                      className="flex-1 p-3 bg-neon-green hover:bg-neon-green/80 rounded-lg text-black font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create & Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-bg-elevated hover:bg-bg-elevated/80 rounded-xl text-white font-medium transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-bg-elevated hover:bg-bg-elevated/80 rounded-xl text-white font-medium transition-colors"
            >
              Cancel
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 py-3 bg-gradient-to-r from-neon-green to-neon-blue rounded-xl text-black font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 4 ? 'Start Game' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameWizard;
