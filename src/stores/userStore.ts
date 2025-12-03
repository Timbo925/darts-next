import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserAccount, GameHistory, AISettings, UserStatistics, GameType } from '../types';

interface UserState {
  users: UserAccount[];
  gameHistory: GameHistory[];
  aiSettings: AISettings;
  
  // Actions
  createUser: (username: string, avatarColor: string) => UserAccount;
  deleteUser: (userId: string) => void;
  addGameHistory: (history: GameHistory) => void;
  deleteGameHistory: (gameId: string) => void;
  updateAISettings: (settings: AISettings) => void;
  getUserStatistics: (userId: string) => UserStatistics;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: [],
      gameHistory: [],
      aiSettings: {
        globalMultiplier: 1.0,
        showVisualization: false,
      },

      createUser: (username: string, avatarColor: string): UserAccount => {
        const newUser: UserAccount = {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          username,
          avatarColor,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          users: [...state.users, newUser],
        }));
        return newUser;
      },

      deleteUser: (userId: string) => {
        set((state) => ({
          users: state.users.filter((u) => u.id !== userId),
        }));
      },

      addGameHistory: (history: GameHistory) => {
        set((state) => ({
          gameHistory: [...state.gameHistory, history],
        }));
      },

      deleteGameHistory: (gameId: string) => {
        set((state) => ({
          gameHistory: state.gameHistory.filter((g) => g.id !== gameId),
        }));
      },

      updateAISettings: (settings: AISettings) => {
        set({ aiSettings: settings });
      },

      getUserStatistics: (userId: string): UserStatistics => {
        const state = get();
        const userGames = state.gameHistory.filter((g) =>
          g.players.some((p) => p.userId === userId)
        );

        const gamesWon = userGames.filter((g) => {
          const player = g.players.find((p) => p.userId === userId);
          return player && g.winnerId === player.id;
        }).length;

        const gameTypeStats: Record<GameType, { played: number; won: number; averagePerDart: number }> = {
          '301': { played: 0, won: 0, averagePerDart: 0 },
          '501': { played: 0, won: 0, averagePerDart: 0 },
          'cricket': { played: 0, won: 0, averagePerDart: 0 },
        };

        let totalDartsThrown = 0;
        let totalScore = 0;
        let highestCheckout = 0;
        const doubleHits: Record<number, number> = {};

        userGames.forEach((game) => {
          const player = game.players.find((p) => p.userId === userId);
          if (!player) return;

          const stats = game.statistics.playerStats[player.id];
          if (!stats) return;

          totalDartsThrown += stats.dartsThrown;
          totalScore += stats.totalScore;

          if (stats.highestCheckout > highestCheckout) {
            highestCheckout = stats.highestCheckout;
          }

          gameTypeStats[game.gameType].played++;
          if (game.winnerId === player.id) {
            gameTypeStats[game.gameType].won++;
          }
        });

        // Find favorite double
        let favoriteDouble = 20;
        let maxDoubleHits = 0;
        Object.entries(doubleHits).forEach(([num, hits]) => {
          if (hits > maxDoubleHits) {
            maxDoubleHits = hits;
            favoriteDouble = parseInt(num);
          }
        });

        return {
          userId,
          gamesPlayed: userGames.length,
          gamesWon,
          winRate: userGames.length > 0 ? (gamesWon / userGames.length) * 100 : 0,
          totalDartsThrown,
          overallAveragePerDart: totalDartsThrown > 0 ? totalScore / totalDartsThrown : 0,
          overallAveragePerTurn: totalDartsThrown > 0 ? (totalScore / totalDartsThrown) * 3 : 0,
          highestCheckout,
          favoriteDouble,
          gameTypeStats,
        };
      },
    }),
    {
      name: 'darts-user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        users: state.users,
        gameHistory: state.gameHistory,
        aiSettings: state.aiSettings,
      }),
    }
  )
);


