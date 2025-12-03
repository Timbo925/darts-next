/**
 * Darts AI System
 * 
 * Provides intelligent AI opponents for both X01 and Cricket games
 * with exponential difficulty scaling from level 1 (beginner) to level 10 (pro).
 */

import { DartboardSegment, DartThrow, GameState, Player } from '../../types';
import { getSegmentCenter, getSegmentFromCoordinates } from '../dartboard';
import { 
  getAccuracyRadius, 
  randomPointInDisc, 
  getExpectedAverage,
  getExpectedMPR,
  getDifficultyDescription,
} from './accuracy';
import { determineX01Target } from './x01Strategy';
import { determineCricketTarget } from './cricketStrategy';

// Re-export utility functions
export { 
  getAccuracyRadius, 
  getExpectedAverage, 
  getExpectedMPR,
  getDifficultyDescription,
};

/**
 * Determine the best target segment for an AI player
 */
export function determineAITarget(
  gameState: GameState,
  playerId: string,
  difficulty: number
): DartboardSegment {
  const rules = gameState.rules;

  if (rules.gameType === 'cricket') {
    return determineCricketTarget(gameState, playerId, difficulty);
  } else {
    return determineX01Target(gameState, playerId, difficulty);
  }
}

/**
 * Simulate an AI throw
 * 
 * The AI:
 * 1. Determines the best target based on game state and difficulty-based strategy
 * 2. Aims at that target
 * 3. Misses by a random amount based on difficulty (exponential scaling)
 * 4. Returns what was actually hit
 */
export function simulateAIThrow(
  gameState: GameState,
  playerId: string,
  difficulty: number,
  globalMultiplier: number = 1
): DartThrow {
  // Get the AI player to access their difficulty
  const player = gameState.players.find(p => p.id === playerId);
  const effectiveDifficulty = player?.difficulty || difficulty;

  // Determine target based on game state and strategy
  const target = determineAITarget(gameState, playerId, effectiveDifficulty);
  
  // Get center coordinates of target segment
  const targetCenter = getSegmentCenter(target.number, target.type);
  
  // Calculate accuracy radius based on difficulty
  const accuracyRadius = getAccuracyRadius(effectiveDifficulty, globalMultiplier);
  
  // Generate random hit point within accuracy disc
  const hitPoint = randomPointInDisc(targetCenter.x, targetCenter.y, accuracyRadius);
  
  // Determine which segment was actually hit
  const hitSegment = getSegmentFromCoordinates(hitPoint.x, hitPoint.y);
  
  return {
    segment: hitSegment,
    playerId,
    timestamp: Date.now(),
    coordinates: hitPoint,
  };
}

/**
 * Get AI player info for display
 */
export function getAIPlayerInfo(player: Player): {
  description: string;
  expectedAvg: number;
  expectedMPR: number;
} {
  const difficulty = player.difficulty || 5;
  return {
    description: getDifficultyDescription(difficulty),
    expectedAvg: getExpectedAverage(difficulty),
    expectedMPR: getExpectedMPR(difficulty),
  };
}

/**
 * Get AI visualization data (target coordinates and accuracy radius)
 * Used for debug visualization on the dartboard
 */
export function getAIVisualizationData(
  gameState: GameState,
  playerId: string,
  difficulty: number,
  globalMultiplier: number = 1
): { targetX: number; targetY: number; accuracyRadius: number } | null {
  const player = gameState.players.find(p => p.id === playerId);
  const effectiveDifficulty = player?.difficulty || difficulty;

  // Determine target based on game state and strategy
  const target = determineAITarget(gameState, playerId, effectiveDifficulty);
  
  // Get center coordinates of target segment
  const targetCenter = getSegmentCenter(target.number, target.type);
  
  // Calculate accuracy radius based on difficulty
  const accuracyRadius = getAccuracyRadius(effectiveDifficulty, globalMultiplier);
  
  return {
    targetX: targetCenter.x,
    targetY: targetCenter.y,
    accuracyRadius,
  };
}


