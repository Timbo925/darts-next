/**
 * X01 (301/501) AI Strategy
 * 
 * Handles target selection for X01 games including:
 * - Double-in requirements
 * - Checkout paths
 * - Bust avoidance
 * - Setup shots
 */

import { DartboardSegment, GameState, X01Score } from '../../types';
import { createSegment } from '../dartboard';
import { getCheckoutPath, isCheckable } from '../checkout';

/**
 * Determine the best target for X01 games
 */
export function determineX01Target(
  gameState: GameState,
  playerId: string,
  _difficulty: number // Reserved for future use
): DartboardSegment {
  const currentLeg = gameState.legs[gameState.currentLegIndex];
  const score = currentLeg.scores[playerId] as X01Score;
  const remaining = score.remaining;
  const rules = gameState.rules;
  const dartsLeft = 3 - gameState.currentThrowInTurn;

  // Check if player needs to double in
  if (rules.doubleIn && !score.hasDoubledIn) {
    return createSegment(20, 'double');
  }

  // Check if player can check out
  if (remaining <= 170 && remaining >= 2) {
    const path = getCheckoutPath(remaining, undefined, dartsLeft);
    if (path && path.possible && path.darts.length > 0) {
      return path.darts[0];
    }
  }

  // High score - just go for T20
  if (remaining > 170) {
    return createSegment(20, 'triple');
  }

  // Mid-range: try to set up a checkout
  // Avoid busting by being smart about target selection
  
  // If remaining is odd and low, we need to hit an odd number first
  if (remaining < 40 && remaining % 2 === 1) {
    // Hit a single to make it even
    const targetSingle = Math.min(remaining - 2, 20);
    if (targetSingle > 0) {
      return createSegment(targetSingle, 'single');
    }
  }

  // Try T20 if it leaves a good checkout
  const afterT20 = remaining - 60;
  if (afterT20 > 1 && isCheckable(afterT20)) {
    return createSegment(20, 'triple');
  }

  // Try T19 if T20 doesn't work
  const afterT19 = remaining - 57;
  if (afterT19 > 1 && isCheckable(afterT19)) {
    return createSegment(19, 'triple');
  }

  // Try T18
  const afterT18 = remaining - 54;
  if (afterT18 > 1 && isCheckable(afterT18)) {
    return createSegment(18, 'triple');
  }

  // Bust avoidance: if we're at a tricky score, be careful
  if (remaining <= 60) {
    // Try to hit a single that leaves a double
    for (const num of [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10]) {
      const afterSingle = remaining - num;
      if (afterSingle >= 2 && afterSingle <= 40 && afterSingle % 2 === 0) {
        return createSegment(num, 'single');
      }
    }
  }

  // Default to T20
  return createSegment(20, 'triple');
}

/**
 * Check if hitting a target could cause a bust
 */
export function wouldBust(
  remaining: number,
  target: DartboardSegment,
  doubleOut: boolean
): boolean {
  const newRemaining = remaining - target.points;
  
  // Gone negative
  if (newRemaining < 0) return true;
  
  // Left on 1 with double out
  if (doubleOut && newRemaining === 1) return true;
  
  // Hit exactly 0 but not with a double (when double out required)
  if (doubleOut && newRemaining === 0) {
    if (target.type !== 'double' && target.type !== 'inner-bull') {
      return true;
    }
  }
  
  return false;
}


