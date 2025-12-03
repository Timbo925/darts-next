// Game Types
export type GameType = '301' | '501' | 'cricket';

export type CricketVariant = 'standard' | 'cutthroat' | 'no-score';

export interface GameRules {
  gameType: GameType;
  doubleIn: boolean;
  doubleOut: boolean;
  cricketVariant?: CricketVariant;
  bestOf: number;
}

// Player Types
export type PlayerType = 'human' | 'ai';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  difficulty?: number; // 1-10 for AI players
  userId?: string; // Reference to user account if logged in
  color: string;
}

// User Account
export interface UserAccount {
  id: string;
  username: string;
  avatarColor: string;
  createdAt: string;
}

// Dartboard Types
export type SegmentType = 'single' | 'double' | 'triple' | 'outer-bull' | 'inner-bull';

export interface DartboardSegment {
  number: number; // 1-20, 25 for bull
  type: SegmentType;
  points: number;
  multiplier: number;
}

export interface DartThrow {
  segment: DartboardSegment | null; // null for miss
  playerId: string;
  timestamp: number;
  coordinates?: { x: number; y: number }; // For AI throw visualization
}

// Scoring Types
export interface X01Score {
  remaining: number;
  dartsThrown: number;
  hasDoubledIn: boolean;
}

export interface CricketMark {
  number: number;
  marks: number; // 0-3
  closed: boolean;
}

export interface CricketScore {
  marks: CricketMark[];
  points: number;
}

export type PlayerScore = X01Score | CricketScore;

// Game State
export interface LegState {
  legNumber: number;
  winnerId: string | null;
  throws: DartThrow[];
  scores: Record<string, PlayerScore>;
}

export interface GameState {
  id: string;
  rules: GameRules;
  players: Player[];
  currentPlayerIndex: number;
  currentThrowInTurn: number; // 0, 1, or 2
  legs: LegState[];
  currentLegIndex: number;
  legsWon: Record<string, number>;
  matchWinnerId: string | null;
  startedAt: string;
  completedAt?: string;
}

// Game History
export interface GameHistory {
  id: string;
  gameType: GameType;
  rules: GameRules;
  players: { id: string; name: string; userId?: string }[];
  winnerId: string | null;
  legs: LegState[];
  legsWon: Record<string, number>;
  startedAt: string;
  completedAt: string;
  statistics: GameStatistics;
}

export interface GameStatistics {
  playerStats: Record<string, PlayerStatistics>;
  cricketStats?: Record<string, CricketPlayerStatistics>;
}

export interface PlayerStatistics {
  dartsThrown: number;
  totalScore: number;
  averagePerDart: number;
  averagePerTurn: number;
  highestTurn: number;
  checkoutAttempts: number;
  checkoutSuccesses: number;
  checkoutPercentage: number;
  highestCheckout: number;
  doublesHit: number;
  triplesHit: number;
  missedDarts: number;
}

// Cricket-specific statistics
export interface CricketPlayerStatistics {
  dartsThrown: number;
  marksPerRound: number;        // MPR - key cricket stat
  totalMarks: number;           // Total marks scored
  totalPoints: number;          // Points scored (standard/cutthroat)
  hitAccuracy: number;          // % of darts hitting cricket numbers
  tripleRate: number;           // % of cricket hits that were triples
  singleRate: number;           // % of cricket hits that were singles
  doubleRate: number;           // % of cricket hits that were doubles
  numbersClosed: number;        // How many of 7 numbers closed (0-7)
  firstToClose: number;         // How many numbers they closed first
  bestRound: number;            // Best single round (marks)
  whiteHorses: number;          // Rounds with 3 triples on different cricket numbers
  hatTricks: number;            // Three bulls in one round
  missedDarts: number;          // Darts that missed everything
  wastedDarts: number;          // Darts on non-cricket numbers
}

// User Statistics (aggregated)
export interface UserStatistics {
  userId: string;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  totalDartsThrown: number;
  overallAveragePerDart: number;
  overallAveragePerTurn: number;
  highestCheckout: number;
  favoriteDouble: number;
  gameTypeStats: Record<GameType, {
    played: number;
    won: number;
    averagePerDart: number;
  }>;
}

// Checkout Path
export interface CheckoutPath {
  score: number;
  darts: DartboardSegment[];
  possible: boolean;
}

// AI Settings
export interface AISettings {
  globalMultiplier: number; // 0.5 - 2.0
  showVisualization: boolean; // Show AI target and accuracy disc during gameplay
}

// App State
export interface AppState {
  currentView: 'home' | 'wizard' | 'game' | 'history' | 'profile';
  users: UserAccount[];
  gameHistory: GameHistory[];
  aiSettings: AISettings;
}

