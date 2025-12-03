import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GameState,
  GameRules,
  Player,
  DartThrow,
  LegState,
  X01Score,
  CricketScore,
  DartboardSegment,
  GameHistory,
  GameStatistics,
  PlayerStatistics,
  CricketPlayerStatistics,
} from '../types';

// Cricket numbers for reference
const CRICKET_NUMBERS = [20, 19, 18, 17, 16, 15, 25];

// X01 leg-specific statistics
export interface X01LegPlayerStats {
  dartsThrown: number;
  totalScore: number;
  averagePerDart: number;
  averagePerTurn: number;
  highestTurn: number;
  doublesHit: number;
  triplesHit: number;
  missedDarts: number;
  checkoutScore?: number; // Only for winner
}

// Cricket leg-specific statistics
export interface CricketLegPlayerStats {
  dartsThrown: number;
  marksPerRound: number;
  totalMarks: number;
  totalPoints: number;
  hitAccuracy: number;
  tripleRate: number;
  singleRate: number;
  doubleRate: number;
  numbersClosed: number;
  bestRound: number;
  missedDarts: number;
  wastedDarts: number;
}

// Leg-specific statistics for the winning screen
export interface LegStatistics {
  legNumber: number;
  winnerId: string;
  gameType: 'x01' | 'cricket';
  // For X01 games
  playerStats?: Record<string, X01LegPlayerStats>;
  // For Cricket games
  cricketStats?: Record<string, CricketLegPlayerStats>;
}

interface GameStore {
  gameState: GameState | null;
  legWinnerInfo: LegStatistics | null; // Track when we need to show leg winner modal
  bustInfo: { playerId: string; scoreBeforeBust: number } | null; // Track bust for UI feedback
  savedGameState: GameState | null; // Saved game for "continue later" feature
  
  // Actions
  startGame: (rules: GameRules, players: Player[]) => void;
  recordThrow: (throwData: DartThrow) => void;
  undoLastThrow: () => void;
  nextTurn: () => void;
  continueLeg: () => void; // Dismiss leg winner modal and continue
  clearBust: () => void; // Clear bust notification
  endGame: () => GameHistory | null;
  resetGame: () => void;
  
  // Save/Load game
  saveGameForLater: () => void;
  loadSavedGame: () => void;
  clearSavedGame: () => void;
  hasSavedGame: () => boolean;
  
  // Helpers
  calculateLegStats: (leg: LegState, players: Player[], rules: GameRules) => LegStatistics | null;
  calculateGameStats: () => GameStatistics;
}

// Initialize scores for a new leg
function initializeScores(rules: GameRules, players: Player[]): Record<string, X01Score | CricketScore> {
  const scores: Record<string, X01Score | CricketScore> = {};

  players.forEach((player) => {
    if (rules.gameType === 'cricket') {
      scores[player.id] = {
        marks: [20, 19, 18, 17, 16, 15, 25].map((num) => ({
          number: num,
          marks: 0,
          closed: false,
        })),
        points: 0,
      };
    } else {
      const startScore = rules.gameType === '301' ? 301 : 501;
      scores[player.id] = {
        remaining: startScore,
        dartsThrown: 0,
        hasDoubledIn: !rules.doubleIn,
      };
    }
  });

  return scores;
}

// Create initial leg state
function createLeg(legNumber: number, rules: GameRules, players: Player[]): LegState {
  return {
    legNumber,
    winnerId: null,
    throws: [],
    scores: initializeScores(rules, players),
  };
}

// Process X01 throw
function processX01Throw(
  score: X01Score,
  segment: DartboardSegment | null,
  rules: GameRules
): { newScore: X01Score; bust: boolean; won: boolean } {
  if (!segment) {
    return {
      newScore: { ...score, dartsThrown: score.dartsThrown + 1 },
      bust: false,
      won: false,
    };
  }

  // Need to double in first
  if (!score.hasDoubledIn) {
    if (segment.type === 'double' || segment.type === 'inner-bull') {
      return {
        newScore: {
          remaining: score.remaining - segment.points,
          dartsThrown: score.dartsThrown + 1,
          hasDoubledIn: true,
        },
        bust: false,
        won: false,
      };
    }
    return {
      newScore: { ...score, dartsThrown: score.dartsThrown + 1 },
      bust: false,
      won: false,
    };
  }

  const newRemaining = score.remaining - segment.points;

  // Check for bust
  if (newRemaining < 0) {
    return { newScore: score, bust: true, won: false };
  }

  // Check for bust (can't finish on 1 with double out)
  if (newRemaining === 1 && rules.doubleOut) {
    return { newScore: score, bust: true, won: false };
  }

  // Check for bust (need double to finish)
  if (newRemaining === 0 && rules.doubleOut && segment.type !== 'double' && segment.type !== 'inner-bull') {
    return { newScore: score, bust: true, won: false };
  }

  // Check for win
  if (newRemaining === 0) {
    return {
      newScore: {
        remaining: 0,
        dartsThrown: score.dartsThrown + 1,
        hasDoubledIn: true,
      },
      bust: false,
      won: true,
    };
  }

  return {
    newScore: {
      remaining: newRemaining,
      dartsThrown: score.dartsThrown + 1,
      hasDoubledIn: true,
    },
    bust: false,
    won: false,
  };
}

// Process Cricket throw
function processCricketThrow(
  scores: Record<string, CricketScore>,
  playerId: string,
  segment: DartboardSegment | null,
  variant: string,
  players: Player[]
): { newScores: Record<string, CricketScore>; won: boolean } {
  if (!segment) {
    return { newScores: scores, won: false };
  }

  const cricketNumbers = [20, 19, 18, 17, 16, 15, 25];
  const segmentNumber = segment.number;

  // Not a cricket number
  if (!cricketNumbers.includes(segmentNumber)) {
    return { newScores: scores, won: false };
  }

  const newScores = { ...scores };
  const playerScore = { ...newScores[playerId] };
  const markIndex = playerScore.marks.findIndex((m) => m.number === segmentNumber);

  if (markIndex === -1) return { newScores: scores, won: false };

  const currentMark = playerScore.marks[markIndex];
  const hitsToAdd = segment.multiplier;
  const wasAlreadyClosed = currentMark.marks >= 3;
  const newMarkCount = Math.min(currentMark.marks + hitsToAdd, 3);

  // Calculate how many hits can score points
  // If already closed: all hits can score
  // If closing now: only the excess hits after reaching 3 can score
  let scoringHits = 0;
  if (wasAlreadyClosed) {
    // Already closed - all hits can potentially score
    scoringHits = hitsToAdd;
  } else if (currentMark.marks + hitsToAdd > 3) {
    // Closing this throw - excess hits can score
    scoringHits = currentMark.marks + hitsToAdd - 3;
  }

  // Update marks (only if not already closed)
  playerScore.marks = [...playerScore.marks];
  playerScore.marks[markIndex] = {
    ...currentMark,
    marks: newMarkCount,
    closed: newMarkCount >= 3,
  };

  // Handle scoring based on variant
  if (scoringHits > 0) {
    if (variant === 'cutthroat') {
      // Cutthroat: Score points AGAINST opponents who haven't closed
      // (giving them points is bad for them, lowest score wins)
      players.forEach((p) => {
        if (p.id !== playerId) {
          const oppScore = newScores[p.id];
          const oppMark = oppScore.marks.find((m) => m.number === segmentNumber);
          if (oppMark && !oppMark.closed) {
            newScores[p.id] = {
              ...oppScore,
              points: oppScore.points + scoringHits * segmentNumber,
            };
          }
        }
      });
    } else if (variant === 'standard') {
      // Standard Cricket: Score points FOR yourself if you've closed
      // the number but at least one opponent hasn't
      const playerHasClosed = newMarkCount >= 3;
      const anyOpponentOpen = players.some((p) => {
        if (p.id === playerId) return false;
        const oppMark = newScores[p.id].marks.find((m) => m.number === segmentNumber);
        return !oppMark?.closed;
      });

      if (playerHasClosed && anyOpponentOpen) {
        playerScore.points += scoringHits * segmentNumber;
      }
    }
    // 'no-score' variant doesn't add points
  }

  newScores[playerId] = playerScore;

  // Check for win
  const playerClosed = playerScore.marks.every((m) => m.closed);
  if (playerClosed) {
    if (variant === 'cutthroat') {
      // Win if all numbers closed and lowest points
      const minPoints = Math.min(...Object.values(newScores).map((s) => s.points));
      if (playerScore.points <= minPoints) {
        return { newScores, won: true };
      }
    } else {
      // Win if all closed and highest points (or no-score: just all closed)
      const maxPoints = Math.max(...Object.values(newScores).map((s) => s.points));
      if (variant === 'no-score' || playerScore.points >= maxPoints) {
        return { newScores, won: true };
      }
    }
  }

  return { newScores, won: false };
}

// Calculate X01 statistics for a single leg
function calculateX01LegStatistics(leg: LegState, players: Player[], rules: GameRules): LegStatistics | null {
  if (!leg.winnerId) return null;

  const playerStats: Record<string, X01LegPlayerStats> = {};

  players.forEach((player) => {
    let totalScore = 0;
    let dartsThrown = 0;
    let highestTurn = 0;
    let doublesHit = 0;
    let triplesHit = 0;
    let missedDarts = 0;
    let turnScore = 0;
    let turnThrows = 0;

    leg.throws.forEach((t, idx) => {
      if (t.playerId !== player.id) return;

      dartsThrown++;

      if (t.segment) {
        totalScore += t.segment.points;
        turnScore += t.segment.points;

        if (t.segment.type === 'double' || t.segment.type === 'inner-bull') {
          doublesHit++;
        }
        if (t.segment.type === 'triple') {
          triplesHit++;
        }
      } else {
        missedDarts++;
      }

      turnThrows++;

      // Check for end of turn (3 darts or different player next)
      const nextThrow = leg.throws[idx + 1];
      if (turnThrows === 3 || !nextThrow || nextThrow.playerId !== player.id) {
        if (turnScore > highestTurn) {
          highestTurn = turnScore;
        }
        turnScore = 0;
        turnThrows = 0;
      }
    });

    // Calculate checkout score for winner
    let checkoutScore: number | undefined;
    if (leg.winnerId === player.id) {
      const playerThrows = leg.throws.filter((t) => t.playerId === player.id);
      const lastThrows: DartThrow[] = [];
      for (let i = playerThrows.length - 1; i >= 0 && lastThrows.length < 3; i--) {
        lastThrows.unshift(playerThrows[i]);
        if (lastThrows.length > 1) {
          const checkScore = lastThrows.reduce((sum, t) => sum + (t.segment?.points || 0), 0);
          if (checkScore >= 2 && checkScore <= 170) {
            checkoutScore = checkScore;
          }
        }
      }
      if (!checkoutScore && lastThrows.length > 0) {
        checkoutScore = lastThrows.reduce((sum, t) => sum + (t.segment?.points || 0), 0);
      }
    }

    playerStats[player.id] = {
      dartsThrown,
      totalScore,
      averagePerDart: dartsThrown > 0 ? totalScore / dartsThrown : 0,
      averagePerTurn: dartsThrown > 0 ? (totalScore / dartsThrown) * 3 : 0,
      highestTurn,
      doublesHit,
      triplesHit,
      missedDarts,
      checkoutScore,
    };
  });

  return {
    legNumber: leg.legNumber,
    winnerId: leg.winnerId,
    gameType: 'x01',
    playerStats,
  };
}

// Calculate Cricket statistics for a single leg
function calculateCricketLegStatistics(leg: LegState, players: Player[]): LegStatistics | null {
  if (!leg.winnerId) return null;

  const cricketStats: Record<string, CricketLegPlayerStats> = {};

  players.forEach((player) => {
    let dartsThrown = 0;
    let totalMarks = 0;
    let missedDarts = 0;
    let wastedDarts = 0;
    let cricketHits = 0;
    let tripleHits = 0;
    let singleHits = 0;
    let doubleHits = 0;
    let roundCount = 0;
    let currentRoundMarks = 0;
    let currentRoundDarts = 0;
    let bestRound = 0;

    leg.throws.forEach((t, idx) => {
      if (t.playerId !== player.id) return;

      dartsThrown++;
      currentRoundDarts++;

      if (t.segment) {
        const isCricketNumber = CRICKET_NUMBERS.includes(t.segment.number);
        
        if (isCricketNumber) {
          cricketHits++;
          const marks = t.segment.multiplier;
          totalMarks += marks;
          currentRoundMarks += marks;
          
          if (t.segment.type === 'triple') {
            tripleHits++;
          } else if (t.segment.type === 'double' || t.segment.type === 'inner-bull') {
            doubleHits++;
          } else {
            singleHits++;
          }
        } else {
          wastedDarts++;
        }
      } else {
        missedDarts++;
      }

      // Check for end of round (3 darts or different player next)
      const nextThrow = leg.throws[idx + 1];
      if (currentRoundDarts === 3 || !nextThrow || nextThrow.playerId !== player.id) {
        roundCount++;
        if (currentRoundMarks > bestRound) {
          bestRound = currentRoundMarks;
        }
        currentRoundMarks = 0;
        currentRoundDarts = 0;
      }
    });

    // Get final number of closed numbers from leg scores
    const playerScore = leg.scores[player.id] as CricketScore;
    const numbersClosed = playerScore?.marks.filter(m => m.closed).length || 0;
    const totalPoints = playerScore?.points || 0;

    cricketStats[player.id] = {
      dartsThrown,
      marksPerRound: roundCount > 0 ? totalMarks / roundCount : 0,
      totalMarks,
      totalPoints,
      hitAccuracy: dartsThrown > 0 ? (cricketHits / dartsThrown) * 100 : 0,
      tripleRate: cricketHits > 0 ? (tripleHits / cricketHits) * 100 : 0,
      singleRate: cricketHits > 0 ? (singleHits / cricketHits) * 100 : 0,
      doubleRate: cricketHits > 0 ? (doubleHits / cricketHits) * 100 : 0,
      numbersClosed,
      bestRound,
      missedDarts,
      wastedDarts,
    };
  });

  return {
    legNumber: leg.legNumber,
    winnerId: leg.winnerId,
    gameType: 'cricket',
    cricketStats,
  };
}

// Calculate statistics for a single leg (dispatcher)
function calculateLegStatistics(leg: LegState, players: Player[], rules: GameRules): LegStatistics | null {
  if (rules.gameType === 'cricket') {
    return calculateCricketLegStatistics(leg, players);
  }
  return calculateX01LegStatistics(leg, players, rules);
}

// Calculate statistics for game history
function calculateStatistics(state: GameState): GameStatistics {
  const playerStats: Record<string, PlayerStatistics> = {};
  const cricketStats: Record<string, CricketPlayerStatistics> = {};
  const isCricket = state.rules.gameType === 'cricket';

  state.players.forEach((player) => {
    if (isCricket) {
      // Cricket-specific stats
      let dartsThrown = 0;
      let totalMarks = 0;
      let missedDarts = 0;
      let wastedDarts = 0;
      let cricketHits = 0;
      let tripleHits = 0;
      let singleHits = 0;
      let doubleHits = 0;
      let roundCount = 0;
      let bestRound = 0;
      let whiteHorses = 0;
      let hatTricks = 0;
      let firstToClose = 0;

      // Track which numbers each player closed first
      const closedBy: Record<number, string> = {};

      state.legs.forEach((leg) => {
        let currentRoundMarks = 0;
        let currentRoundDarts = 0;
        let currentRoundTriples: number[] = [];
        let currentRoundBulls = 0;

        leg.throws.forEach((t, idx) => {
          if (t.playerId !== player.id) return;

          dartsThrown++;
          currentRoundDarts++;

          if (t.segment) {
            const isCricketNumber = CRICKET_NUMBERS.includes(t.segment.number);
            
            if (isCricketNumber) {
              cricketHits++;
              const marks = t.segment.multiplier;
              totalMarks += marks;
              currentRoundMarks += marks;
              
              if (t.segment.type === 'triple') {
                tripleHits++;
                currentRoundTriples.push(t.segment.number);
              } else if (t.segment.type === 'double' || t.segment.type === 'inner-bull') {
                doubleHits++;
                if (t.segment.number === 25) {
                  currentRoundBulls++;
                }
              } else if (t.segment.type === 'outer-bull') {
                singleHits++;
                currentRoundBulls++;
              } else {
                singleHits++;
              }
            } else {
              wastedDarts++;
            }
          } else {
            missedDarts++;
          }

          // Check for end of round
          const nextThrow = leg.throws[idx + 1];
          if (currentRoundDarts === 3 || !nextThrow || nextThrow.playerId !== player.id) {
            roundCount++;
            if (currentRoundMarks > bestRound) {
              bestRound = currentRoundMarks;
            }
            
            // Check for white horse (3 triples on different cricket numbers in one round)
            const uniqueTriples = new Set(currentRoundTriples);
            if (uniqueTriples.size >= 3) {
              whiteHorses++;
            }
            
            // Check for hat trick (3 bulls in one round)
            if (currentRoundBulls >= 3) {
              hatTricks++;
            }
            
            currentRoundMarks = 0;
            currentRoundDarts = 0;
            currentRoundTriples = [];
            currentRoundBulls = 0;
          }
        });
      });

      // Get total points from final leg
      const lastLeg = state.legs[state.legs.length - 1];
      const playerScore = lastLeg?.scores[player.id] as CricketScore | undefined;
      const totalPoints = playerScore?.points || 0;
      const numbersClosed = playerScore?.marks.filter(m => m.closed).length || 0;

      cricketStats[player.id] = {
        dartsThrown,
        marksPerRound: roundCount > 0 ? totalMarks / roundCount : 0,
        totalMarks,
        totalPoints,
        hitAccuracy: dartsThrown > 0 ? (cricketHits / dartsThrown) * 100 : 0,
        tripleRate: cricketHits > 0 ? (tripleHits / cricketHits) * 100 : 0,
        singleRate: cricketHits > 0 ? (singleHits / cricketHits) * 100 : 0,
        doubleRate: cricketHits > 0 ? (doubleHits / cricketHits) * 100 : 0,
        numbersClosed,
        firstToClose,
        bestRound,
        whiteHorses,
        hatTricks,
        missedDarts,
        wastedDarts,
      };

      // Also populate basic playerStats for compatibility
      playerStats[player.id] = {
        dartsThrown,
        totalScore: totalMarks,
        averagePerDart: dartsThrown > 0 ? totalMarks / dartsThrown : 0,
        averagePerTurn: roundCount > 0 ? totalMarks / roundCount : 0,
        highestTurn: bestRound,
        checkoutAttempts: 0,
        checkoutSuccesses: 0,
        checkoutPercentage: 0,
        highestCheckout: 0,
        doublesHit: doubleHits,
        triplesHit: tripleHits,
        missedDarts,
      };
    } else {
      // X01 stats (301, 501)
      let totalScore = 0;
      let dartsThrown = 0;
      let highestTurn = 0;
      let doublesHit = 0;
      let triplesHit = 0;
      let missedDarts = 0;
      let checkoutAttempts = 0;
      let checkoutSuccesses = 0;
      let highestCheckout = 0;

      state.legs.forEach((leg) => {
        let turnScore = 0;
        let turnThrows = 0;

        leg.throws.forEach((t, idx) => {
          if (t.playerId !== player.id) return;

          dartsThrown++;

          if (t.segment) {
            totalScore += t.segment.points;
            turnScore += t.segment.points;

            if (t.segment.type === 'double' || t.segment.type === 'inner-bull') {
              doublesHit++;
            }
            if (t.segment.type === 'triple') {
              triplesHit++;
            }
          } else {
            missedDarts++;
          }

          turnThrows++;

          // Check for end of turn
          if (turnThrows === 3 || idx === leg.throws.length - 1) {
            if (turnScore > highestTurn) {
              highestTurn = turnScore;
            }
            turnScore = 0;
            turnThrows = 0;
          }
        });

        // Check for checkout
        if (leg.winnerId === player.id) {
          const playerThrows = leg.throws.filter((t) => t.playerId === player.id);
          const lastThrow = playerThrows[playerThrows.length - 1];
          if (lastThrow?.segment) {
            checkoutSuccesses++;
            let checkoutScore = lastThrow.segment.points;
            const lastTwo = playerThrows.slice(-3);
            lastTwo.forEach((t) => {
              if (t.segment) checkoutScore += t.segment.points;
            });
            if (checkoutScore > highestCheckout) {
              highestCheckout = Math.min(checkoutScore, 170);
            }
          }
        }
      });

      playerStats[player.id] = {
        dartsThrown,
        totalScore,
        averagePerDart: dartsThrown > 0 ? totalScore / dartsThrown : 0,
        averagePerTurn: dartsThrown > 0 ? (totalScore / dartsThrown) * 3 : 0,
        highestTurn,
        checkoutAttempts,
        checkoutSuccesses,
        checkoutPercentage: checkoutAttempts > 0 ? (checkoutSuccesses / checkoutAttempts) * 100 : 0,
        highestCheckout,
        doublesHit,
        triplesHit,
        missedDarts,
      };
    }
  });

  return { 
    playerStats,
    cricketStats: isCricket ? cricketStats : undefined,
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: null,
      legWinnerInfo: null,
      bustInfo: null,
      savedGameState: null,

  startGame: (rules: GameRules, players: Player[]) => {
    const legsWon: Record<string, number> = {};
    players.forEach((p) => {
      legsWon[p.id] = 0;
    });

    set({
      gameState: {
        id: `game_${Date.now()}`,
        rules,
        players,
        currentPlayerIndex: 0,
        currentThrowInTurn: 0,
        legs: [createLeg(1, rules, players)],
        currentLegIndex: 0,
        legsWon,
        matchWinnerId: null,
        startedAt: new Date().toISOString(),
      },
      legWinnerInfo: null,
      bustInfo: null,
    });
  },

  recordThrow: (throwData: DartThrow) => {
    const state = get().gameState;
    if (!state) return;

    const currentLeg = state.legs[state.currentLegIndex];
    const currentPlayer = state.players[state.currentPlayerIndex];
    const segment = throwData.segment;

    // Add throw to history
    const newThrows = [...currentLeg.throws, throwData];
    let newScores = { ...currentLeg.scores };
    let legWinnerId: string | null = null;

    if (state.rules.gameType === 'cricket') {
      const result = processCricketThrow(
        newScores as Record<string, CricketScore>,
        currentPlayer.id,
        segment,
        state.rules.cricketVariant || 'standard',
        state.players
      );
      newScores = result.newScores;
      if (result.won) {
        legWinnerId = currentPlayer.id;
      }
    } else {
      const playerScore = newScores[currentPlayer.id] as X01Score;
      const result = processX01Throw(playerScore, segment, state.rules);

      if (result.bust) {
        // Bust - reset to score at start of turn and end turn immediately
        const startScore = state.rules.gameType === '301' ? 301 : 501;
        
        // Calculate score before this turn started
        let scoreBeforeTurn = startScore;
        // Get all throws before this turn
        const throwsBeforeThisTurn = currentLeg.throws.filter((t) => t.playerId === currentPlayer.id);
        
        // Calculate how many throws were in previous turns (multiples of 3)
        const throwsInPreviousTurns = Math.floor(throwsBeforeThisTurn.length / 3) * 3;
        const previousTurnThrows = throwsBeforeThisTurn.slice(0, throwsInPreviousTurns);
        
        previousTurnThrows.forEach((t) => {
          if (t.segment && playerScore.hasDoubledIn) {
            scoreBeforeTurn -= t.segment.points;
          } else if (t.segment && (t.segment.type === 'double' || t.segment.type === 'inner-bull')) {
            // First double counts
            scoreBeforeTurn -= t.segment.points;
          }
        });

        // Reset score and update leg
        newScores[currentPlayer.id] = {
          ...playerScore,
          remaining: scoreBeforeTurn,
          dartsThrown: playerScore.dartsThrown + 1,
        };

        const newLeg: LegState = {
          ...currentLeg,
          throws: newThrows,
          scores: newScores,
        };

        const newLegs = [...state.legs];
        newLegs[state.currentLegIndex] = newLeg;

        // Advance to next player (bust ends the turn)
        const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

        set({
          gameState: {
            ...state,
            legs: newLegs,
            currentPlayerIndex: nextPlayerIndex,
            currentThrowInTurn: 0,
          },
          bustInfo: {
            playerId: currentPlayer.id,
            scoreBeforeBust: scoreBeforeTurn,
          },
        });
        return;
      } else {
        newScores[currentPlayer.id] = result.newScore;
        if (result.won) {
          legWinnerId = currentPlayer.id;
        }
      }
    }

    // Update leg
    const newLeg: LegState = {
      ...currentLeg,
      throws: newThrows,
      scores: newScores,
      winnerId: legWinnerId,
    };

    const newLegs = [...state.legs];
    newLegs[state.currentLegIndex] = newLeg;

    // Check if leg is won
    if (legWinnerId) {
      const newLegsWon = { ...state.legsWon };
      newLegsWon[legWinnerId]++;

      // Check if match is won
      const legsNeeded = Math.ceil(state.rules.bestOf / 2);
      const matchWinnerId = newLegsWon[legWinnerId] >= legsNeeded ? legWinnerId : null;

      // Calculate leg statistics for the modal
      const legStats = calculateLegStatistics(newLeg, state.players, state.rules);

      if (matchWinnerId) {
        set({
          gameState: {
            ...state,
            legs: newLegs,
            legsWon: newLegsWon,
            matchWinnerId,
            completedAt: new Date().toISOString(),
          },
          legWinnerInfo: null, // Don't show leg modal for game winner
        });
        return;
      }

      // Store leg winner info but don't start new leg yet
      set({
        gameState: {
          ...state,
          legs: newLegs,
          legsWon: newLegsWon,
        },
        legWinnerInfo: legStats,
        bustInfo: null,
      });
      return;
    }

    // Advance throw counter
    const newThrowInTurn = state.currentThrowInTurn + 1;

    set({
      gameState: {
        ...state,
        legs: newLegs,
        currentThrowInTurn: newThrowInTurn,
      },
    });
  },

  continueLeg: () => {
    const state = get().gameState;
    if (!state || !get().legWinnerInfo) return;

    // Start new leg
    const newLegState = createLeg(state.legs.length + 1, state.rules, state.players);
    const newLegs = [...state.legs, newLegState];

    set({
      gameState: {
        ...state,
        legs: newLegs,
        currentLegIndex: newLegs.length - 1,
        currentPlayerIndex: 0,
        currentThrowInTurn: 0,
      },
      legWinnerInfo: null,
    });
  },

  undoLastThrow: () => {
    const state = get().gameState;
    if (!state) return;

    const currentLeg = state.legs[state.currentLegIndex];
    if (currentLeg.throws.length === 0) return;

    // Remove last throw
    const newThrows = currentLeg.throws.slice(0, -1);

    // Recalculate scores from scratch
    const freshScores = initializeScores(state.rules, state.players);

    if (state.rules.gameType === 'cricket') {
      newThrows.forEach((t) => {
        const result = processCricketThrow(
          freshScores as Record<string, CricketScore>,
          t.playerId,
          t.segment,
          state.rules.cricketVariant || 'standard',
          state.players
        );
        Object.assign(freshScores, result.newScores);
      });
    } else {
      newThrows.forEach((t) => {
        const playerScore = freshScores[t.playerId] as X01Score;
        const result = processX01Throw(playerScore, t.segment, state.rules);
        if (!result.bust) {
          freshScores[t.playerId] = result.newScore;
        }
      });
    }

    const newLeg: LegState = {
      ...currentLeg,
      throws: newThrows,
      scores: freshScores,
    };

    const newLegs = [...state.legs];
    newLegs[state.currentLegIndex] = newLeg;

    // Determine current player and throw from throw history
    let currentPlayerIndex = state.currentPlayerIndex;
    let currentThrowInTurn = state.currentThrowInTurn - 1;

    if (currentThrowInTurn < 0) {
      currentPlayerIndex = (currentPlayerIndex - 1 + state.players.length) % state.players.length;
      currentThrowInTurn = 2;
    }

    set({
      gameState: {
        ...state,
        legs: newLegs,
        currentPlayerIndex,
        currentThrowInTurn,
      },
    });
  },

  nextTurn: () => {
    const state = get().gameState;
    if (!state) return;

    const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

    set({
      gameState: {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        currentThrowInTurn: 0,
      },
      bustInfo: null,
    });
  },

  clearBust: () => {
    set({ bustInfo: null });
  },

  calculateLegStats: (leg: LegState, players: Player[], rules: GameRules) => {
    return calculateLegStatistics(leg, players, rules);
  },

  calculateGameStats: () => {
    const state = get().gameState;
    if (!state) return { playerStats: {} };
    return calculateStatistics(state);
  },

  endGame: (): GameHistory | null => {
    const state = get().gameState;
    if (!state) return null;

    const history: GameHistory = {
      id: state.id,
      gameType: state.rules.gameType,
      rules: state.rules,
      players: state.players.map((p) => ({
        id: p.id,
        name: p.name,
        userId: p.userId,
      })),
      winnerId: state.matchWinnerId,
      legs: state.legs,
      legsWon: state.legsWon,
      startedAt: state.startedAt,
      completedAt: state.completedAt || new Date().toISOString(),
      statistics: calculateStatistics(state),
    };

    set({ gameState: null, legWinnerInfo: null, bustInfo: null });
    return history;
  },

  resetGame: () => {
    set({ gameState: null, legWinnerInfo: null, bustInfo: null });
  },

  saveGameForLater: () => {
    const state = get().gameState;
    if (state) {
      set({ 
        savedGameState: state, 
        gameState: null, 
        legWinnerInfo: null, 
        bustInfo: null 
      });
    }
  },

  loadSavedGame: () => {
    const saved = get().savedGameState;
    if (saved) {
      set({ 
        gameState: saved, 
        savedGameState: null, 
        legWinnerInfo: null, 
        bustInfo: null 
      });
    }
  },

  clearSavedGame: () => {
    set({ savedGameState: null });
  },

  hasSavedGame: () => {
    return get().savedGameState !== null;
  },
    }),
    {
      name: 'darts-game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ savedGameState: state.savedGameState }),
    }
  )
);
