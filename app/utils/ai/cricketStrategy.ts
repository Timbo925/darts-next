/**
 * Cricket AI Strategy
 * 
 * Implements intelligent Cricket play with tiered strategy based on difficulty:
 * - All levels understand the basic rules and win conditions
 * - Higher levels make smarter strategic decisions
 * 
 * Key Rules ALL levels understand:
 * 1. Must have most points (standard) or least points (cutthroat) to win
 * 2. Can score points on numbers I've closed but opponent hasn't
 * 3. Must close all 7 numbers to be eligible to win
 */

import { DartboardSegment, GameState, CricketScore } from '../../types';
import { createSegment } from '../dartboard';

// Cricket numbers in standard priority order
const CRICKET_NUMBERS = [20, 19, 18, 17, 16, 15, 25];

/**
 * Analysis result for current Cricket game state
 */
interface CricketAnalysis {
  myScore: CricketScore;
  opponentScores: CricketScore[];
  myPoints: number;
  maxOpponentPoints: number;
  minOpponentPoints: number;
  pointDifferential: number; // Positive = I'm ahead
  myClosedNumbers: number[];
  myOpenNumbers: number[];
  scoringOpportunities: ScoringOpportunity[];
  closingPriorities: ClosingPriority[];
  variant: string;
  isCutthroat: boolean;
  canWinNow: boolean;
}

interface ScoringOpportunity {
  number: number;
  pointValue: number;
  opponentsOpen: number; // How many opponents haven't closed this
}

interface ClosingPriority {
  number: number;
  myMarks: number;
  marksNeeded: number;
  opponentMarks: number; // Highest opponent marks on this number
  priority: number; // Higher = more important to close
}

/**
 * Analyze the current Cricket game state
 */
function analyzeCricketState(
  gameState: GameState,
  playerId: string
): CricketAnalysis {
  const currentLeg = gameState.legs[gameState.currentLegIndex];
  const myScore = currentLeg.scores[playerId] as CricketScore;
  const variant = gameState.rules.cricketVariant || 'standard';
  const isCutthroat = variant === 'cutthroat';

  // Get opponent scores
  const opponentScores: CricketScore[] = [];
  for (const [id, score] of Object.entries(currentLeg.scores)) {
    if (id !== playerId) {
      opponentScores.push(score as CricketScore);
    }
  }

  const myPoints = myScore.points;
  const opponentPointsList = opponentScores.map(s => s.points);
  const maxOpponentPoints = Math.max(...opponentPointsList, 0);
  const minOpponentPoints = Math.min(...opponentPointsList, Infinity);

  // In cutthroat, we want LOWEST points, so differential is inverted
  const pointDifferential = isCutthroat
    ? minOpponentPoints - myPoints // Positive = I have fewer points (good)
    : myPoints - maxOpponentPoints; // Positive = I have more points (good)

  // Find my closed and open numbers
  const myClosedNumbers: number[] = [];
  const myOpenNumbers: number[] = [];
  
  for (const mark of myScore.marks) {
    if (mark.closed) {
      myClosedNumbers.push(mark.number);
    } else {
      myOpenNumbers.push(mark.number);
    }
  }

  // Find scoring opportunities (numbers I've closed but at least one opponent hasn't)
  const scoringOpportunities: ScoringOpportunity[] = [];
  
  for (const num of myClosedNumbers) {
    let opponentsOpen = 0;
    for (const oppScore of opponentScores) {
      const oppMark = oppScore.marks.find(m => m.number === num);
      if (!oppMark?.closed) {
        opponentsOpen++;
      }
    }
    
    if (opponentsOpen > 0) {
      scoringOpportunities.push({
        number: num,
        pointValue: num,
        opponentsOpen,
      });
    }
  }

  // Sort scoring opportunities by point value (highest first)
  scoringOpportunities.sort((a, b) => b.pointValue - a.pointValue);

  // Calculate closing priorities for open numbers
  const closingPriorities: ClosingPriority[] = [];
  
  for (const num of myOpenNumbers) {
    const myMark = myScore.marks.find(m => m.number === num);
    const myMarks = myMark?.marks || 0;
    
    // Find highest opponent marks on this number
    let maxOppMarks = 0;
    for (const oppScore of opponentScores) {
      const oppMark = oppScore.marks.find(m => m.number === num);
      maxOppMarks = Math.max(maxOppMarks, oppMark?.marks || 0);
    }

    // Priority based on:
    // - Higher numbers are worth more
    // - Numbers we're close to closing
    // - Numbers opponents are close to closing (defensive)
    const baseValue = num === 25 ? 25 : num; // Bull is valuable
    const progressBonus = myMarks * 10; // Reward being close to closing
    const urgencyBonus = maxOppMarks * 5; // Defend against opponent progress
    
    closingPriorities.push({
      number: num,
      myMarks,
      marksNeeded: 3 - myMarks,
      opponentMarks: maxOppMarks,
      priority: baseValue + progressBonus + urgencyBonus,
    });
  }

  // Sort by priority (highest first)
  closingPriorities.sort((a, b) => b.priority - a.priority);

  // Check if we can win now (all closed and leading in points)
  const allClosed = myOpenNumbers.length === 0;
  const leadingInPoints = isCutthroat
    ? myPoints <= minOpponentPoints
    : myPoints >= maxOpponentPoints;
  const canWinNow = allClosed && leadingInPoints;

  return {
    myScore,
    opponentScores,
    myPoints,
    maxOpponentPoints,
    minOpponentPoints,
    pointDifferential,
    myClosedNumbers,
    myOpenNumbers,
    scoringOpportunities,
    closingPriorities,
    variant,
    isCutthroat,
    canWinNow,
  };
}

/**
 * Select a target for scoring points
 */
function selectScoringTarget(
  analysis: CricketAnalysis,
  difficulty: number
): DartboardSegment {
  const { scoringOpportunities, isCutthroat } = analysis;
  
  if (scoringOpportunities.length === 0) {
    // No scoring opportunities, shouldn't happen but fallback
    return createSegment(20, 'triple');
  }

  if (isCutthroat) {
    // In cutthroat, we want to give points to opponents
    // Higher difficulty = target opponents with fewer points more strategically
    // For now, just hit the highest value number we can score on
    const best = scoringOpportunities[0];
    return best.number === 25 
      ? createSegment(25, 'inner-bull') 
      : createSegment(best.number, 'triple');
  }

  // Standard Cricket: score points for ourselves
  // Higher levels might consider which target they're more likely to hit
  // For now, go for highest value
  
  if (difficulty >= 7) {
    // Advanced: Consider that singles are easier to hit than triples
    // But triples give more points...
    // Still go for triple on high numbers
    const best = scoringOpportunities[0];
    return best.number === 25 
      ? createSegment(25, 'inner-bull') 
      : createSegment(best.number, 'triple');
  } else {
    // Lower levels: Just go for highest number
    const best = scoringOpportunities[0];
    return best.number === 25 
      ? createSegment(25, 'inner-bull') 
      : createSegment(best.number, 'triple');
  }
}

/**
 * Select a target for closing numbers
 */
function selectClosingTarget(
  analysis: CricketAnalysis,
  difficulty: number
): DartboardSegment {
  const { closingPriorities, myOpenNumbers } = analysis;

  if (closingPriorities.length === 0 || myOpenNumbers.length === 0) {
    // All closed, shouldn't reach here but fallback
    return createSegment(20, 'triple');
  }

  if (difficulty >= 8) {
    // Advanced strategy: Consider opponent progress and defensive plays
    // Prioritize numbers opponent is close to closing (to deny scoring)
    const urgentDefense = closingPriorities.find(p => p.opponentMarks >= 2);
    if (urgentDefense) {
      return urgentDefense.number === 25
        ? createSegment(25, 'inner-bull')
        : createSegment(urgentDefense.number, 'triple');
    }
  }

  if (difficulty >= 5) {
    // Intermediate: Prioritize numbers we're close to closing
    const almostClosed = closingPriorities.find(p => p.myMarks >= 2);
    if (almostClosed) {
      return almostClosed.number === 25
        ? createSegment(25, 'inner-bull')
        : createSegment(almostClosed.number, 'triple');
    }
  }

  // Basic strategy: Go in priority order (highest value numbers first)
  // But still respect the calculated priority which includes progress
  const target = closingPriorities[0];
  return target.number === 25
    ? createSegment(25, 'inner-bull')
    : createSegment(target.number, 'triple');
}

/**
 * Main function: Determine the best target for Cricket
 * 
 * ALL difficulty levels understand these core rules:
 * 1. If all numbers closed, must score to win (or already winning)
 * 2. If behind in points, need to score on closed numbers
 * 3. Need to close all numbers eventually
 */
export function determineCricketTarget(
  gameState: GameState,
  playerId: string,
  difficulty: number
): DartboardSegment {
  const analysis = analyzeCricketState(gameState, playerId);
  
  // === RULE 1: All closed - either win or keep scoring ===
  if (analysis.myOpenNumbers.length === 0) {
    if (analysis.canWinNow) {
      // We're winning! Just need to not miss. Aim for highest closed number.
      const best = analysis.myClosedNumbers
        .filter(n => n !== 25)
        .sort((a, b) => b - a)[0] || 20;
      return createSegment(best, 'triple');
    }
    
    // All closed but not leading - MUST score
    if (analysis.scoringOpportunities.length > 0) {
      return selectScoringTarget(analysis, difficulty);
    }
    
    // No scoring opportunities (opponent closed everything too)
    // This is a losing position - just throw at 20
    return createSegment(20, 'triple');
  }

  // === RULE 2: Behind in points - prioritize scoring ===
  const significantlyBehind = analysis.isCutthroat
    ? analysis.pointDifferential < -20 // We have 20+ more points (bad in cutthroat)
    : analysis.pointDifferential < -20; // We have 20+ fewer points
  
  if (significantlyBehind && analysis.scoringOpportunities.length > 0) {
    // We need points! Score before closing more numbers
    return selectScoringTarget(analysis, difficulty);
  }

  // === RULE 3: Slightly behind or even - balance scoring and closing ===
  const slightlyBehind = analysis.pointDifferential < 0;
  
  if (slightlyBehind && analysis.scoringOpportunities.length > 0) {
    // Difficulty affects whether we prioritize scoring or closing
    if (difficulty >= 6) {
      // Smarter: Score first to ensure we can win when we close
      return selectScoringTarget(analysis, difficulty);
    } else {
      // Basic: 50% chance to score, 50% to close
      if (Math.random() < 0.5) {
        return selectScoringTarget(analysis, difficulty);
      }
    }
  }

  // === RULE 4: Ahead or even in points - close numbers ===
  // But consider scoring opportunities if they're valuable
  
  if (analysis.scoringOpportunities.length > 0 && difficulty >= 7) {
    // Advanced: If we have a high-value scoring opportunity, take it
    const bestScoring = analysis.scoringOpportunities[0];
    if (bestScoring.pointValue >= 18 && analysis.pointDifferential < 40) {
      // Good scoring number and we're not too far ahead - keep pressure on
      return selectScoringTarget(analysis, difficulty);
    }
  }

  // === DEFAULT: Close numbers strategically ===
  return selectClosingTarget(analysis, difficulty);
}


