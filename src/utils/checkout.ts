import { DartboardSegment, CheckoutPath } from '../types';
import { createSegment, getAllSegments } from './dartboard';

// Pre-computed optimal checkout paths for common scores
// Format: score -> array of [segment descriptions] for 1, 2, or 3 darts
const CHECKOUT_TABLE: Record<number, string[][]> = {
  170: [['T20', 'T20', 'Bull']],
  167: [['T20', 'T19', 'Bull']],
  164: [['T20', 'T18', 'Bull']],
  161: [['T20', 'T17', 'Bull']],
  160: [['T20', 'T20', 'D20']],
  158: [['T20', 'T20', 'D19']],
  157: [['T20', 'T19', 'D20']],
  156: [['T20', 'T20', 'D18']],
  155: [['T20', 'T19', 'D19']],
  154: [['T20', 'T18', 'D20']],
  153: [['T20', 'T19', 'D18']],
  152: [['T20', 'T20', 'D16']],
  151: [['T20', 'T17', 'D20']],
  150: [['T20', 'T18', 'D18']],
  149: [['T20', 'T19', 'D16']],
  148: [['T20', 'T20', 'D14']],
  147: [['T20', 'T17', 'D18']],
  146: [['T20', 'T18', 'D16']],
  145: [['T20', 'T19', 'D14']],
  144: [['T20', 'T20', 'D12']],
  143: [['T20', 'T17', 'D16']],
  142: [['T20', 'T14', 'D20']],
  141: [['T20', 'T19', 'D12']],
  140: [['T20', 'T20', 'D10']],
  139: [['T20', 'T13', 'D20']],
  138: [['T20', 'T18', 'D12']],
  137: [['T20', 'T19', 'D10']],
  136: [['T20', 'T20', 'D8']],
  135: [['T20', 'T17', 'D12']],
  134: [['T20', 'T14', 'D16']],
  133: [['T20', 'T19', 'D8']],
  132: [['T20', 'T16', 'D12']],
  131: [['T20', 'T13', 'D16']],
  130: [['T20', 'T18', 'D8']],
  129: [['T19', 'T16', 'D12']],
  128: [['T18', 'T14', 'D16']],
  127: [['T20', 'T17', 'D8']],
  126: [['T19', 'T19', 'D6']],
  125: [['T18', 'T13', 'D16']],
  124: [['T20', 'T16', 'D8']],
  123: [['T19', 'T16', 'D9']],
  122: [['T18', 'T18', 'D7']],
  121: [['T20', 'T11', 'D14']],
  120: [['T20', '20', 'D20']],
  119: [['T19', 'T12', 'D13']],
  118: [['T20', '18', 'D20']],
  117: [['T20', '17', 'D20']],
  116: [['T20', '16', 'D20']],
  115: [['T20', '15', 'D20']],
  114: [['T20', '14', 'D20']],
  113: [['T20', '13', 'D20']],
  112: [['T20', '12', 'D20']],
  111: [['T20', '19', 'D16']],
  110: [['T20', '10', 'D20']],
  109: [['T20', '9', 'D20']],
  108: [['T20', '16', 'D16']],
  107: [['T20', '15', 'D16']],
  106: [['T20', '14', 'D16']],
  105: [['T20', '13', 'D16']],
  104: [['T20', '12', 'D16']],
  103: [['T20', '11', 'D16']],
  102: [['T20', '10', 'D16']],
  101: [['T20', '9', 'D16']],
  100: [['T20', 'D20']],
  99: [['T19', '10', 'D16']],
  98: [['T20', 'D19']],
  97: [['T19', 'D20']],
  96: [['T20', 'D18']],
  95: [['T19', 'D19']],
  94: [['T18', 'D20']],
  93: [['T19', 'D18']],
  92: [['T20', 'D16']],
  91: [['T17', 'D20']],
  90: [['T18', 'D18']],
  89: [['T19', 'D16']],
  88: [['T20', 'D14']],
  87: [['T17', 'D18']],
  86: [['T18', 'D16']],
  85: [['T19', 'D14']],
  84: [['T20', 'D12']],
  83: [['T17', 'D16']],
  82: [['T14', 'D20']],
  81: [['T19', 'D12']],
  80: [['T20', 'D10']],
  79: [['T13', 'D20']],
  78: [['T18', 'D12']],
  77: [['T19', 'D10']],
  76: [['T20', 'D8']],
  75: [['T17', 'D12']],
  74: [['T14', 'D16']],
  73: [['T19', 'D8']],
  72: [['T16', 'D12']],
  71: [['T13', 'D16']],
  70: [['T18', 'D8']],
  69: [['T19', 'D6']],
  68: [['T20', 'D4']],
  67: [['T17', 'D8']],
  66: [['T10', 'D18']],
  65: [['T19', 'D4']],
  64: [['T16', 'D8']],
  63: [['T13', 'D12']],
  62: [['T10', 'D16']],
  61: [['T15', 'D8']],
  60: [['20', 'D20']],
  59: [['19', 'D20']],
  58: [['18', 'D20']],
  57: [['17', 'D20']],
  56: [['16', 'D20']],
  55: [['15', 'D20']],
  54: [['14', 'D20']],
  53: [['13', 'D20']],
  52: [['12', 'D20']],
  51: [['11', 'D20']],
  50: [['Bull']],
  49: [['9', 'D20']],
  48: [['16', 'D16']],
  47: [['15', 'D16']],
  46: [['14', 'D16']],
  45: [['13', 'D16']],
  44: [['12', 'D16']],
  43: [['11', 'D16']],
  42: [['10', 'D16']],
  41: [['9', 'D16']],
  40: [['D20']],
  39: [['7', 'D16']],
  38: [['D19']],
  37: [['5', 'D16']],
  36: [['D18']],
  35: [['3', 'D16']],
  34: [['D17']],
  33: [['1', 'D16']],
  32: [['D16']],
  31: [['7', 'D12']],
  30: [['D15']],
  29: [['13', 'D8']],
  28: [['D14']],
  27: [['11', 'D8']],
  26: [['D13']],
  25: [['9', 'D8']],
  24: [['D12']],
  23: [['7', 'D8']],
  22: [['D11']],
  21: [['5', 'D8']],
  20: [['D10']],
  19: [['3', 'D8']],
  18: [['D9']],
  17: [['1', 'D8']],
  16: [['D8']],
  15: [['7', 'D4']],
  14: [['D7']],
  13: [['5', 'D4']],
  12: [['D6']],
  11: [['3', 'D4']],
  10: [['D5']],
  9: [['1', 'D4']],
  8: [['D4']],
  7: [['3', 'D2']],
  6: [['D3']],
  5: [['1', 'D2']],
  4: [['D2']],
  3: [['1', 'D1']],
  2: [['D1']],
};

// Parse segment string to DartboardSegment
function parseSegmentString(str: string): DartboardSegment {
  if (str === 'Bull') {
    return createSegment(25, 'inner-bull');
  }
  
  if (str.startsWith('T')) {
    const num = parseInt(str.slice(1));
    return createSegment(num, 'triple');
  }
  
  if (str.startsWith('D')) {
    const num = parseInt(str.slice(1));
    return createSegment(num, 'double');
  }
  
  const num = parseInt(str);
  return createSegment(num, 'single');
}

// Get checkout path for a given score
export function getCheckoutPath(
  score: number,
  preferredDouble?: number,
  dartsRemaining: number = 3
): CheckoutPath | null {
  if (score < 2 || score > 170) {
    return null;
  }

  // First, try to find a path with the preferred double
  if (preferredDouble && score >= preferredDouble * 2) {
    const pathWithPreferred = findPathWithDouble(score, preferredDouble, dartsRemaining);
    if (pathWithPreferred) {
      return pathWithPreferred;
    }
  }

  // Fall back to standard checkout table
  const paths = CHECKOUT_TABLE[score];
  if (!paths || paths.length === 0) {
    // Try to calculate a path dynamically
    return calculateCheckoutPath(score, dartsRemaining);
  }

  // Filter paths by darts remaining
  const validPaths = paths.filter(p => p.length <= dartsRemaining);
  if (validPaths.length === 0) {
    return { score, darts: [], possible: false };
  }

  const darts = validPaths[0].map(parseSegmentString);
  return { score, darts, possible: true };
}

// Find the best setup segment for a given points value
// Prefers singles over doubles/triples for easier hitting
function findBestSetupSegment(allSegments: DartboardSegment[], points: number): DartboardSegment | undefined {
  const candidates = allSegments.filter(s => s.points === points);
  if (candidates.length === 0) return undefined;
  
  // Prefer singles, then outer-bull, then doubles, then triples, then inner-bull
  const priority: Record<string, number> = {
    'single': 1,
    'outer-bull': 2,
    'double': 3,
    'triple': 4,
    'inner-bull': 5,
  };
  
  candidates.sort((a, b) => (priority[a.type] || 99) - (priority[b.type] || 99));
  return candidates[0];
}

// Find a checkout path that uses a specific double
function findPathWithDouble(
  score: number,
  preferredDouble: number,
  dartsRemaining: number
): CheckoutPath | null {
  const doubleValue = preferredDouble * 2;
  
  if (score === doubleValue && dartsRemaining >= 1) {
    return {
      score,
      darts: [createSegment(preferredDouble, 'double')],
      possible: true,
    };
  }

  const remaining = score - doubleValue;
  if (remaining <= 0) return null;

  // Try to find a setup for the remaining score
  const allSegments = getAllSegments();
  
  // One dart setup + double (prefer singles for setup shots)
  if (dartsRemaining >= 2) {
    const singleDartSetup = findBestSetupSegment(allSegments, remaining);
    if (singleDartSetup) {
      return {
        score,
        darts: [singleDartSetup, createSegment(preferredDouble, 'double')],
        possible: true,
      };
    }
  }

  // Two dart setup + double
  if (dartsRemaining >= 3) {
    for (const s1 of allSegments) {
      if (s1.points >= remaining) continue;
      const remainder = remaining - s1.points;
      const s2 = findBestSetupSegment(allSegments, remainder);
      if (s2) {
        return {
          score,
          darts: [s1, s2, createSegment(preferredDouble, 'double')],
          possible: true,
        };
      }
    }
  }

  return null;
}

// Calculate checkout path dynamically
function calculateCheckoutPath(score: number, dartsRemaining: number): CheckoutPath | null {
  const allSegments = getAllSegments();
  const doubles = allSegments.filter(s => s.type === 'double' || s.type === 'inner-bull');

  // Sort doubles by value (prefer higher doubles)
  doubles.sort((a, b) => b.points - a.points);

  // One dart checkout
  if (dartsRemaining >= 1) {
    const oneDart = doubles.find(d => d.points === score);
    if (oneDart) {
      return { score, darts: [oneDart], possible: true };
    }
  }

  // Two dart checkout (prefer singles for setup shots)
  if (dartsRemaining >= 2) {
    for (const double of doubles) {
      if (double.points > score) continue;
      const remaining = score - double.points;
      const setup = findBestSetupSegment(allSegments, remaining);
      if (setup) {
        return { score, darts: [setup, double], possible: true };
      }
    }
  }

  // Three dart checkout
  if (dartsRemaining >= 3) {
    for (const double of doubles) {
      if (double.points > score) continue;
      const remaining = score - double.points;
      
      for (const s1 of allSegments) {
        if (s1.points >= remaining) continue;
        const r2 = remaining - s1.points;
        const s2 = findBestSetupSegment(allSegments, r2);
        if (s2) {
          return { score, darts: [s1, s2, double], possible: true };
        }
      }
    }
  }

  return { score, darts: [], possible: false };
}

// Check if a score is checkable in given number of darts
export function isCheckable(score: number, dartsRemaining: number = 3): boolean {
  const path = getCheckoutPath(score, undefined, dartsRemaining);
  return path !== null && path.possible;
}

// Get all possible doubles for checkout
export function getPossibleDoubles(): number[] {
  return [20, 16, 12, 10, 8, 18, 14, 6, 4, 2, 19, 17, 15, 13, 11, 9, 7, 5, 3, 1];
}

/**
 * Get doubles that are actually valid for a checkout from the current score.
 * A double is valid if there exists a checkout path that ends with that double.
 * @param score The current remaining score
 * @param dartsRemaining Number of darts left (default 3)
 */
export function getValidCheckoutDoubles(score: number, dartsRemaining: number = 3): number[] {
  if (score < 2 || score > 170) {
    return [];
  }

  const validDoubles: number[] = [];
  const allDoubles = getPossibleDoubles();
  const allSegments = getAllSegments();

  for (const d of allDoubles) {
    const doubleValue = d * 2;
    
    // Can't checkout with this double if it's higher than the score
    if (doubleValue > score) continue;

    // Direct double checkout
    if (doubleValue === score && dartsRemaining >= 1) {
      validDoubles.push(d);
      continue;
    }

    const remaining = score - doubleValue;
    if (remaining <= 0) continue;

    // One dart setup + double (2 darts needed)
    if (dartsRemaining >= 2) {
      const hasSetup = allSegments.some(s => s.points === remaining);
      if (hasSetup) {
        validDoubles.push(d);
        continue;
      }
    }

    // Two dart setup + double (3 darts needed)
    if (dartsRemaining >= 3) {
      let found = false;
      for (const s1 of allSegments) {
        if (s1.points >= remaining) continue;
        const r2 = remaining - s1.points;
        const hasS2 = allSegments.some(s => s.points === r2);
        if (hasS2) {
          found = true;
          break;
        }
      }
      if (found) {
        validDoubles.push(d);
        continue;
      }
    }
  }

  // Sort by preference (higher doubles first, common finishes)
  return validDoubles.sort((a, b) => {
    // Prioritize common finish doubles
    const priority = [20, 16, 8, 10, 12, 18, 14, 6, 4, 2];
    const aIdx = priority.indexOf(a);
    const bIdx = priority.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return b - a; // Higher doubles preferred
  });
}

// Format checkout path for display
export function formatCheckoutPath(path: CheckoutPath): string {
  if (!path.possible || path.darts.length === 0) {
    return 'No checkout available';
  }

  return path.darts.map(dart => {
    if (dart.type === 'inner-bull') return 'Bull';
    if (dart.type === 'outer-bull') return '25';
    const prefix = dart.type === 'double' ? 'D' : dart.type === 'triple' ? 'T' : '';
    return `${prefix}${dart.number}`;
  }).join(' → ');
}


