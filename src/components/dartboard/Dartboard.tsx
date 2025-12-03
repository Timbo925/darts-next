import React, { useState, useCallback, useRef } from 'react';
import { DartboardSegment, DartThrow } from '../../types';
import {
  DARTBOARD_NUMBERS,
  VISUAL_RADII,
  BOARD_COLORS,
  getSegmentAngle,
  createArcPath,
  getSegmentColor,
  getSegmentFromCoordinates,
  polarToCartesian,
} from '../../utils/dartboard';

// AI Visualization data
interface AIVisualization {
  targetX: number;
  targetY: number;
  accuracyRadius: number;
}

interface DartboardProps {
  onThrow: (segment: DartboardSegment | null) => void;
  disabled?: boolean;
  recentThrows?: DartThrow[];
  highlightedSegments?: DartboardSegment[];
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onCorrect?: () => void;
  canCorrect?: boolean;
  aiVisualization?: AIVisualization | null;
}

const Dartboard: React.FC<DartboardProps> = ({
  onThrow,
  disabled = false,
  recentThrows = [],
  highlightedSegments = [],
  isFullscreen = false,
  onToggleFullscreen,
  onCorrect,
  canCorrect = false,
  aiVisualization = null,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const viewBox = '-125 -125 250 250';
  const boardRadius = 100;

  // Convert click position to dartboard coordinates using proper SVG transformation
  const handleClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (disabled) return;

      const svg = svgRef.current;
      if (!svg) return;

      // Use SVG's built-in coordinate transformation for accurate mapping
      // This properly handles aspect ratio preservation and any CSS transforms
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      
      // Transform screen coordinates to SVG viewBox coordinates
      const svgPoint = pt.matrixTransform(ctm.inverse());

      const segment = getSegmentFromCoordinates(svgPoint.x, svgPoint.y);
      onThrow(segment);
    },
    [disabled, onThrow]
  );

  // Generate segment paths (base layer without highlights)
  const renderSegments = () => {
    const segments: React.JSX.Element[] = [];

    // Render numbered segments
    DARTBOARD_NUMBERS.forEach((number, index) => {
      const { start, end, mid } = getSegmentAngle(index);

      // Double ring (outer)
      const doublePath = createArcPath(
        0, 0,
        VISUAL_RADII.doubleInner,
        VISUAL_RADII.doubleOuter,
        start, end
      );
      const doubleKey = `double-${number}`;

      segments.push(
        <path
          key={doubleKey}
          d={doublePath}
          fill={getSegmentColor(index, 'double')}
          stroke={BOARD_COLORS.wire}
          strokeWidth="0.5"
          className={`cursor-pointer transition-all duration-150 ${
            hoveredSegment === doubleKey ? 'brightness-125' : ''
          }`}
          onMouseEnter={() => setHoveredSegment(doubleKey)}
          onMouseLeave={() => setHoveredSegment(null)}
        />
      );

      // Outer single (between triple and double)
      const outerSinglePath = createArcPath(
        0, 0,
        VISUAL_RADII.tripleOuter,
        VISUAL_RADII.doubleInner,
        start, end
      );
      const outerSingleKey = `outer-single-${number}`;

      segments.push(
        <path
          key={outerSingleKey}
          d={outerSinglePath}
          fill={getSegmentColor(index, 'single')}
          stroke={BOARD_COLORS.wire}
          strokeWidth="0.5"
          className={`cursor-pointer transition-all duration-150 ${
            hoveredSegment === outerSingleKey ? 'brightness-125' : ''
          }`}
          onMouseEnter={() => setHoveredSegment(outerSingleKey)}
          onMouseLeave={() => setHoveredSegment(null)}
        />
      );

      // Triple ring
      const triplePath = createArcPath(
        0, 0,
        VISUAL_RADII.tripleInner,
        VISUAL_RADII.tripleOuter,
        start, end
      );
      const tripleKey = `triple-${number}`;

      segments.push(
        <path
          key={tripleKey}
          d={triplePath}
          fill={getSegmentColor(index, 'triple')}
          stroke={BOARD_COLORS.wire}
          strokeWidth="0.5"
          className={`cursor-pointer transition-all duration-150 ${
            hoveredSegment === tripleKey ? 'brightness-125' : ''
          }`}
          onMouseEnter={() => setHoveredSegment(tripleKey)}
          onMouseLeave={() => setHoveredSegment(null)}
        />
      );

      // Inner single (between bull and triple)
      const innerSinglePath = createArcPath(
        0, 0,
        VISUAL_RADII.outerBull,
        VISUAL_RADII.tripleInner,
        start, end
      );
      const innerSingleKey = `inner-single-${number}`;

      segments.push(
        <path
          key={innerSingleKey}
          d={innerSinglePath}
          fill={getSegmentColor(index, 'single')}
          stroke={BOARD_COLORS.wire}
          strokeWidth="0.5"
          className={`cursor-pointer transition-all duration-150 ${
            hoveredSegment === innerSingleKey ? 'brightness-125' : ''
          }`}
          onMouseEnter={() => setHoveredSegment(innerSingleKey)}
          onMouseLeave={() => setHoveredSegment(null)}
        />
      );

      // Number labels - positioned in center of grey ring (between doubleOuter and background)
      const labelPos = polarToCartesian(0, 0, boardRadius + 8, mid);
      segments.push(
        <text
          key={`label-${number}`}
          x={labelPos.x}
          y={labelPos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white text-[9px] font-bold pointer-events-none select-none"
        >
          {number}
        </text>
      );
    });

    return segments;
  };

  // Render highlight overlay (rendered on top of everything)
  const renderHighlightOverlay = () => {
    if (highlightedSegments.length === 0) return null;

    const highlights: React.JSX.Element[] = [];

    highlightedSegments.forEach((segment, idx) => {
      const number = segment.number;
      const index = DARTBOARD_NUMBERS.indexOf(number);
      
      if (segment.type === 'double' && index !== -1) {
        const { start, end } = getSegmentAngle(index);
        const path = createArcPath(0, 0, VISUAL_RADII.doubleInner, VISUAL_RADII.doubleOuter, start, end);
        highlights.push(
          <path
            key={`highlight-double-${number}-${idx}`}
            d={path}
            fill="#22c55e"
            stroke="#4ade80"
            strokeWidth="2"
            filter="url(#checkout-glow)"
            className="animate-pulse pointer-events-none"
          />
        );
      } else if (segment.type === 'triple' && index !== -1) {
        const { start, end } = getSegmentAngle(index);
        const path = createArcPath(0, 0, VISUAL_RADII.tripleInner, VISUAL_RADII.tripleOuter, start, end);
        highlights.push(
          <path
            key={`highlight-triple-${number}-${idx}`}
            d={path}
            fill="#22c55e"
            stroke="#4ade80"
            strokeWidth="2"
            filter="url(#checkout-glow)"
            className="animate-pulse pointer-events-none"
          />
        );
      } else if (segment.type === 'single' && index !== -1) {
        const { start, end } = getSegmentAngle(index);
        // Highlight both inner and outer single areas
        const outerPath = createArcPath(0, 0, VISUAL_RADII.tripleOuter, VISUAL_RADII.doubleInner, start, end);
        const innerPath = createArcPath(0, 0, VISUAL_RADII.outerBull, VISUAL_RADII.tripleInner, start, end);
        highlights.push(
          <path
            key={`highlight-outer-single-${number}-${idx}`}
            d={outerPath}
            fill="#22c55e"
            stroke="#4ade80"
            strokeWidth="2"
            filter="url(#checkout-glow)"
            className="animate-pulse pointer-events-none"
          />,
          <path
            key={`highlight-inner-single-${number}-${idx}`}
            d={innerPath}
            fill="#22c55e"
            stroke="#4ade80"
            strokeWidth="2"
            filter="url(#checkout-glow)"
            className="animate-pulse pointer-events-none"
          />
        );
      } else if (segment.type === 'outer-bull') {
        highlights.push(
          <circle
            key={`highlight-outer-bull-${idx}`}
            cx={0}
            cy={0}
            r={VISUAL_RADII.outerBull}
            fill="#22c55e"
            stroke="#4ade80"
            strokeWidth="2"
            filter="url(#checkout-glow)"
            className="animate-pulse pointer-events-none"
          />
        );
      } else if (segment.type === 'inner-bull') {
        highlights.push(
          <circle
            key={`highlight-inner-bull-${idx}`}
            cx={0}
            cy={0}
            r={VISUAL_RADII.innerBull}
            fill="#22c55e"
            stroke="#4ade80"
            strokeWidth="2"
            filter="url(#checkout-glow)"
            className="animate-pulse pointer-events-none"
          />
        );
      }
    });

    return highlights;
  };

  // Render bullseye (base layer)
  const renderBullseye = () => {
    return (
      <>
        {/* Outer bull */}
        <circle
          cx={0}
          cy={0}
          r={VISUAL_RADII.outerBull}
          fill={BOARD_COLORS.outerBull}
          stroke={BOARD_COLORS.wire}
          strokeWidth="0.5"
          className={`cursor-pointer transition-all duration-150 ${
            hoveredSegment === 'outer-bull' ? 'brightness-125' : ''
          }`}
          onMouseEnter={() => setHoveredSegment('outer-bull')}
          onMouseLeave={() => setHoveredSegment(null)}
        />
        {/* Inner bull */}
        <circle
          cx={0}
          cy={0}
          r={VISUAL_RADII.innerBull}
          fill={BOARD_COLORS.innerBull}
          stroke={BOARD_COLORS.wire}
          strokeWidth="0.5"
          className={`cursor-pointer transition-all duration-150 ${
            hoveredSegment === 'inner-bull' ? 'brightness-125' : ''
          }`}
          onMouseEnter={() => setHoveredSegment('inner-bull')}
          onMouseLeave={() => setHoveredSegment(null)}
        />
      </>
    );
  };

  // Render throw markers - use stable keys based on timestamp to prevent re-animation
  const renderThrowMarkers = () => {
    return recentThrows.map((throwData) => {
      if (!throwData.coordinates) return null;

      // Use timestamp as stable key to prevent re-animation
      const stableKey = `throw-${throwData.timestamp}`;

      return (
        <g key={stableKey} className="dart-marker">
          {/* Outer glow */}
          <circle
            cx={throwData.coordinates.x}
            cy={throwData.coordinates.y}
            r={4}
            fill="none"
            stroke="#FFD700"
            strokeWidth="2"
            opacity="0.6"
          />
          {/* Inner marker */}
          <circle
            cx={throwData.coordinates.x}
            cy={throwData.coordinates.y}
            r={2}
            fill="#FFD700"
          />
        </g>
      );
    });
  };

  // Render AI visualization (target + accuracy disc)
  const renderAIVisualization = () => {
    if (!aiVisualization) return null;

    const { targetX, targetY, accuracyRadius } = aiVisualization;

    return (
      <g className="ai-visualization">
        {/* Accuracy disc - semi-transparent circle showing throw variance */}
        <circle
          cx={targetX}
          cy={targetY}
          r={accuracyRadius}
          fill="rgba(239, 68, 68, 0.15)"
          stroke="#ef4444"
          strokeWidth="1"
          strokeDasharray="4 2"
          className="animate-pulse"
        />
        {/* Target crosshair */}
        <line
          x1={targetX - 6}
          y1={targetY}
          x2={targetX + 6}
          y2={targetY}
          stroke="#3b82f6"
          strokeWidth="1.5"
        />
        <line
          x1={targetX}
          y1={targetY - 6}
          x2={targetX}
          y2={targetY + 6}
          stroke="#3b82f6"
          strokeWidth="1.5"
        />
        {/* Target center dot */}
        <circle
          cx={targetX}
          cy={targetY}
          r={2}
          fill="#3b82f6"
        />
      </g>
    );
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Fullscreen toggle button - only when not in fullscreen */}
      {onToggleFullscreen && !isFullscreen && (
        <button
          onClick={onToggleFullscreen}
          className="absolute top-2 right-2 z-10 p-2 rounded-lg bg-bg-elevated/80 hover:bg-bg-elevated text-white transition-colors"
          aria-label="Enter fullscreen"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      )}

      <svg
        ref={svgRef}
        viewBox={viewBox}
        className={`${disabled ? 'opacity-60 pointer-events-none' : ''}`}
        onClick={handleClick}
        style={{ 
          width: isFullscreen ? 'auto' : '100%',
          height: isFullscreen ? 'auto' : '100%',
          maxWidth: isFullscreen ? '95vh' : undefined,
          maxHeight: isFullscreen ? '95vh' : undefined,
        }}
      >
        {/* SVG Filters for glow effects */}
        <defs>
          <filter id="checkout-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle cx={0} cy={0} r={boardRadius + 15} fill="#2a2a2a" />
        <circle cx={0} cy={0} r={boardRadius} fill="#1a1a1a" />

        {/* Segments */}
        {renderSegments()}

        {/* Bullseye */}
        {renderBullseye()}

        {/* Checkout highlight overlay - rendered on top of all segments */}
        {renderHighlightOverlay()}

        {/* AI target visualization (when enabled in debug settings) */}
        {renderAIVisualization()}

        {/* Throw markers */}
        {renderThrowMarkers()}
      </svg>

      {/* Correct button - positioned in bottom left corner */}
      {onCorrect && (
        <button
          onClick={onCorrect}
          disabled={!canCorrect}
          className={`absolute bottom-4 left-4 py-3 px-5 rounded-xl font-bold text-lg transition-all flex items-center gap-2 ${
            !canCorrect
              ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg hover:shadow-amber-500/25'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Correct
        </button>
      )}

      {/* Miss button - positioned in bottom right corner */}
      <button
        onClick={() => !disabled && onThrow(null)}
        disabled={disabled}
        className={`absolute bottom-4 right-4 py-3 px-6 rounded-xl font-bold text-lg transition-all ${
          disabled
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg hover:shadow-red-500/25'
        }`}
      >
        MISS
      </button>
    </div>
  );
};

export default Dartboard;
