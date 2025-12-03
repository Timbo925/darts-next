/**
 * AI Accuracy System
 * 
 * Uses exponential scaling for difficulty levels 1-10:
 * - Level 1: Radius ~120 (essentially random, hits anywhere on board)
 * - Level 5: Radius ~40 (mediocre club player)
 * - Level 10: Radius ~8 (professional accuracy)
 */

// Accuracy radius bounds
const MIN_RADIUS = 8;    // Level 10 (professional)
const MAX_RADIUS = 120;  // Level 1 (random)

/**
 * Calculate accuracy radius using exponential scaling
 * This creates bigger jumps at lower levels and refined differences at higher levels
 */
export function getAccuracyRadius(difficulty: number, globalMultiplier: number = 1): number {
  // Clamp difficulty to 1-10 range
  const clampedDifficulty = Math.max(1, Math.min(10, difficulty));
  
  // Exponential scaling: t goes from 1 (level 1) to 0 (level 10)
  const t = (10 - clampedDifficulty) / 9;
  
  // Exponential interpolation between MIN and MAX radius
  const radius = MIN_RADIUS * Math.pow(MAX_RADIUS / MIN_RADIUS, t);
  
  return radius * globalMultiplier;
}

/**
 * Generate a random point within a disc using uniform distribution
 * Uses square root for even distribution across the disc area
 */
export function randomPointInDisc(
  centerX: number, 
  centerY: number, 
  radius: number
): { x: number; y: number } {
  // Use square root for uniform distribution in disc
  const r = radius * Math.sqrt(Math.random());
  const theta = Math.random() * 2 * Math.PI;
  
  return {
    x: centerX + r * Math.cos(theta),
    y: centerY + r * Math.sin(theta),
  };
}

/**
 * Get expected 3-dart average for a difficulty level (for UI display)
 */
export function getExpectedAverage(difficulty: number): number {
  // Exponential scaling matches accuracy radius
  // Level 1 ~12, Level 5 ~32, Level 10 ~58
  const averages: Record<number, number> = {
    1: 12,
    2: 18,
    3: 24,
    4: 28,
    5: 32,
    6: 38,
    7: 44,
    8: 50,
    9: 54,
    10: 58,
  };
  return averages[Math.min(10, Math.max(1, difficulty))] || 25;
}

/**
 * Get expected MPR (Marks Per Round) for Cricket
 */
export function getExpectedMPR(difficulty: number): number {
  const mprs: Record<number, number> = {
    1: 0.5,
    2: 0.8,
    3: 1.0,
    4: 1.3,
    5: 1.6,
    6: 2.0,
    7: 2.5,
    8: 3.0,
    9: 3.5,
    10: 4.2,
  };
  return mprs[Math.min(10, Math.max(1, difficulty))] || 1.5;
}

/**
 * Get human-readable difficulty description
 */
export function getDifficultyDescription(difficulty: number): string {
  if (difficulty <= 2) return 'Beginner';
  if (difficulty <= 4) return 'Casual';
  if (difficulty <= 6) return 'Club Player';
  if (difficulty <= 8) return 'Advanced';
  if (difficulty <= 9) return 'Expert';
  return 'Professional';
}

// For debugging: log radius values for all levels
export function debugRadiusValues(): void {
  console.log('AI Difficulty Radius Values:');
  for (let level = 1; level <= 10; level++) {
    const radius = getAccuracyRadius(level);
    console.log(`Level ${level}: radius = ${radius.toFixed(1)}`);
  }
}


