import { DartboardSegment, SegmentType } from '../types';

// Dartboard number order (clockwise starting from top)
export const DARTBOARD_NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

// Board radii - Exaggerated doubles and triples for easier touch/click on UI
// Both humans and AI use these same proportions for fair gameplay
export const VISUAL_RADII = {
  innerBull: 3.5,
  outerBull: 8.5,
  tripleInner: 38,
  tripleOuter: 48,     // Exaggerated for easier clicking
  singleOuter: 80,
  doubleInner: 80,
  doubleOuter: 100,
};

// Colors
export const BOARD_COLORS = {
  black: '#1a1a1a',
  cream: '#E8DCC4',
  green: '#1B5E20',
  red: '#B71C1C',
  wire: '#C0C0C0',
  innerBull: '#B71C1C',
  outerBull: '#1B5E20',
};

// Get the angle for a segment index (0-19)
export function getSegmentAngle(index: number): { start: number; end: number; mid: number } {
  const segmentSize = 360 / 20;
  const offset = -90 - segmentSize / 2; // Start from top, offset by half segment
  const start = offset + index * segmentSize;
  const end = start + segmentSize;
  const mid = (start + end) / 2;
  return { start, end, mid };
}

// Convert polar to cartesian coordinates
export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// Create SVG arc path
export function createArcPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const start1 = polarToCartesian(cx, cy, outerRadius, startAngle);
  const end1 = polarToCartesian(cx, cy, outerRadius, endAngle);
  const start2 = polarToCartesian(cx, cy, innerRadius, endAngle);
  const end2 = polarToCartesian(cx, cy, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    'M', start1.x, start1.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 1, end1.x, end1.y,
    'L', start2.x, start2.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 0, end2.x, end2.y,
    'Z'
  ].join(' ');
}

// Get segment color based on position and type
export function getSegmentColor(index: number, type: SegmentType): string {
  if (type === 'inner-bull') return BOARD_COLORS.innerBull;
  if (type === 'outer-bull') return BOARD_COLORS.outerBull;

  const isEvenSegment = index % 2 === 0;

  if (type === 'double' || type === 'triple') {
    return isEvenSegment ? BOARD_COLORS.red : BOARD_COLORS.green;
  }

  // Single segments alternate black/cream
  return isEvenSegment ? BOARD_COLORS.black : BOARD_COLORS.cream;
}

// Get segment from coordinates (used for both click detection and AI)
export function getSegmentFromCoordinates(
  x: number,
  y: number
): DartboardSegment | null {
  const distance = Math.sqrt(x * x + y * y);

  // Outside the board
  if (distance > VISUAL_RADII.doubleOuter) {
    return null;
  }

  // Bullseye
  if (distance <= VISUAL_RADII.innerBull) {
    return { number: 25, type: 'inner-bull', points: 50, multiplier: 2 };
  }

  if (distance <= VISUAL_RADII.outerBull) {
    return { number: 25, type: 'outer-bull', points: 25, multiplier: 1 };
  }

  // Calculate angle and find segment number
  let angle = Math.atan2(y, x) * (180 / Math.PI);
  angle = (angle + 90 + 360) % 360; // Adjust to start from top
  
  const segmentSize = 360 / 20;
  const segmentIndex = Math.floor((angle + segmentSize / 2) % 360 / segmentSize);
  const number = DARTBOARD_NUMBERS[segmentIndex];

  // Determine ring type
  let type: SegmentType;
  let multiplier: number;

  if (distance <= VISUAL_RADII.tripleInner) {
    type = 'single';
    multiplier = 1;
  } else if (distance <= VISUAL_RADII.tripleOuter) {
    type = 'triple';
    multiplier = 3;
  } else if (distance <= VISUAL_RADII.doubleInner) {
    type = 'single';
    multiplier = 1;
  } else {
    type = 'double';
    multiplier = 2;
  }

  return {
    number,
    type,
    points: number * multiplier,
    multiplier,
  };
}

// Create segment for specific number and type
export function createSegment(number: number, type: SegmentType): DartboardSegment {
  let multiplier = 1;
  if (type === 'double' || type === 'inner-bull') multiplier = 2;
  if (type === 'triple') multiplier = 3;

  const basePoints = type === 'inner-bull' || type === 'outer-bull' ? 25 : number;

  return {
    number: type === 'inner-bull' || type === 'outer-bull' ? 25 : number,
    type,
    points: basePoints * multiplier,
    multiplier,
  };
}

// Format segment for display
export function formatSegment(segment: DartboardSegment | null): string {
  if (!segment) return 'Miss';
  if (segment.type === 'inner-bull') return 'Bull (50)';
  if (segment.type === 'outer-bull') return 'Bull (25)';
  
  const prefix = segment.type === 'double' ? 'D' : segment.type === 'triple' ? 'T' : '';
  return `${prefix}${segment.number}`;
}

// Get all possible segments for checkout calculation
export function getAllSegments(): DartboardSegment[] {
  const segments: DartboardSegment[] = [];

  // Add bullseyes
  segments.push(createSegment(25, 'inner-bull'));
  segments.push(createSegment(25, 'outer-bull'));

  // Add all numbered segments
  for (let num = 1; num <= 20; num++) {
    segments.push(createSegment(num, 'single'));
    segments.push(createSegment(num, 'double'));
    segments.push(createSegment(num, 'triple'));
  }

  return segments;
}

// Get center coordinates for a segment (used for AI targeting)
export function getSegmentCenter(number: number, type: SegmentType): { x: number; y: number } {
  if (type === 'inner-bull' || type === 'outer-bull') {
    return { x: 0, y: 0 };
  }

  const index = DARTBOARD_NUMBERS.indexOf(number);
  const { mid: angle } = getSegmentAngle(index);

  let radius: number;
  switch (type) {
    case 'double':
      radius = (VISUAL_RADII.doubleInner + VISUAL_RADII.doubleOuter) / 2;
      break;
    case 'triple':
      radius = (VISUAL_RADII.tripleInner + VISUAL_RADII.tripleOuter) / 2;
      break;
    default:
      radius = (VISUAL_RADII.outerBull + VISUAL_RADII.tripleInner) / 2;
  }

  return polarToCartesian(0, 0, radius, angle);
}
