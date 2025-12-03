import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useUserStore } from '../../stores/userStore';
import Dartboard from '../dartboard/Dartboard';
import X01Scoreboard from '../scoring/X01Scoreboard';
import CricketScoreboard from '../scoring/CricketScoreboard';
import LegWinnerModal from './LegWinnerModal';
import GameWinnerScreen from './GameWinnerScreen';
import { DartboardSegment, DartThrow, X01Score, CricketScore } from '../../types';
import { simulateAIThrow, getAIVisualizationData } from '../../utils/ai/index';
import { formatSegment } from '../../utils/dartboard';
import { getCheckoutPath } from '../../utils/checkout';

interface GameViewProps {
  onGameEnd: () => void;
}

const GameView: React.FC<GameViewProps> = ({ onGameEnd }) => {
  const { 
    gameState, 
    legWinnerInfo,
    bustInfo,
    recordThrow, 
    undoLastThrow, 
    nextTurn, 
    continueLeg,
    clearBust,
    endGame, 
    resetGame,
    calculateGameStats,
  } = useGameStore();
  const { aiSettings, addGameHistory } = useUserStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [preferredDouble, setPreferredDouble] = useState(20);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [showBustNotification, setShowBustNotification] = useState(false);
  
  // Track AI throws for the current turn only (with coordinates for display)
  const [aiTurnThrows, setAiTurnThrows] = useState<DartThrow[]>([]);
  
  // AI visualization data (target + accuracy disc)
  const [aiVisualization, setAiVisualization] = useState<{
    targetX: number;
    targetY: number;
    accuracyRadius: number;
  } | null>(null);

  // Show bust notification when bustInfo changes
  useEffect(() => {
    if (bustInfo) {
      setShowBustNotification(true);
      const timer = setTimeout(() => {
        setShowBustNotification(false);
        clearBust();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [bustInfo, clearBust]);

  const currentPlayer = gameState?.players[gameState.currentPlayerIndex];
  const currentLeg = gameState?.legs[gameState.currentLegIndex];
  const isAITurn = currentPlayer?.type === 'ai';
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Check if human turn is complete and needs to advance
  const humanTurnComplete = !isAITurn && gameState !== null && gameState.currentThrowInTurn >= 3;

  // Clear AI throws and visualization when player changes
  useEffect(() => {
    if (!isAITurn) {
      setAiTurnThrows([]);
      setAiVisualization(null);
    }
  }, [gameState?.currentPlayerIndex, isAITurn]);

  // Get current turn throws for this player (from game state, for display in sidebar)
  const getCurrentTurnThrows = () => {
    if (!currentLeg || !currentPlayer || !gameState) return [];
    const allThrows = currentLeg.throws;
    const throwsInCurrentTurn: DartThrow[] = [];
    
    // Count backwards from end to find throws in current turn
    for (let i = allThrows.length - 1; i >= 0 && throwsInCurrentTurn.length < gameState.currentThrowInTurn; i--) {
      if (allThrows[i].playerId === currentPlayer.id) {
        throwsInCurrentTurn.unshift(allThrows[i]);
      } else {
        break; // Different player, not current turn
      }
    }
    return throwsInCurrentTurn;
  };

  const currentTurnThrows = getCurrentTurnThrows();

  // Handle AI turns
  useEffect(() => {
    if (!gameState || !isAITurn || isProcessingAI || gameState.matchWinnerId || legWinnerInfo) return;

    setIsProcessingAI(true);
    setAiTurnThrows([]); // Clear previous AI throws

    const processAITurn = async () => {
      let dartsThrown = 0;
      const throwsThisTurn: DartThrow[] = [];
      const aiPlayerId = currentPlayer!.id;
      
      while (dartsThrown < 3) {
        const currentState = gameStateRef.current;
        if (!currentState || currentState.matchWinnerId) break;
        
        const currentLegState = currentState.legs[currentState.currentLegIndex];
        if (currentLegState.winnerId) break;

        // Check if it's still this AI's turn (bust causes turn change)
        const stillMyTurn = currentState.players[currentState.currentPlayerIndex]?.id === aiPlayerId;
        if (!stillMyTurn) break;

        // Update AI visualization before throwing (if enabled)
        if (aiSettings.showVisualization) {
          const vizData = getAIVisualizationData(
            currentState,
            aiPlayerId,
            currentPlayer!.difficulty || 5,
            aiSettings.globalMultiplier
          );
          setAiVisualization(vizData);
        }

        // Wait to show visualization before throwing
        await new Promise(resolve => setTimeout(resolve, 800));

        const aiThrow = simulateAIThrow(
          currentState,
          aiPlayerId,
          currentPlayer!.difficulty || 5,
          aiSettings.globalMultiplier
        );

        // Add to local tracking for display
        throwsThisTurn.push(aiThrow);
        setAiTurnThrows([...throwsThisTurn]);
        
        // Record in game state
        recordThrow(aiThrow);
        dartsThrown++;

        // Clear visualization after throw
        setAiVisualization(null);

        // Check again if bust occurred after recording throw
        const stateAfterThrow = gameStateRef.current;
        if (stateAfterThrow) {
          const stillMyTurnAfter = stateAfterThrow.players[stateAfterThrow.currentPlayerIndex]?.id === aiPlayerId;
          if (!stillMyTurnAfter) break; // Bust occurred, turn ended
        }

        await new Promise(resolve => setTimeout(resolve, 400));
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      
      const finalState = gameStateRef.current;
      if (finalState && !finalState.matchWinnerId && !useGameStore.getState().legWinnerInfo) {
        const finalLeg = finalState.legs[finalState.currentLegIndex];
        // Only call nextTurn if we're still on this AI's turn (no bust occurred)
        const stillAITurn = finalState.players[finalState.currentPlayerIndex]?.id === aiPlayerId;
        if (!finalLeg.winnerId && stillAITurn) {
          nextTurn();
        }
      }
      setIsProcessingAI(false);
    };

    processAITurn();
  }, [gameState?.currentPlayerIndex, isAITurn, gameState?.currentLegIndex, legWinnerInfo]);

  // Handle human throw
  const handleThrow = useCallback((segment: DartboardSegment | null) => {
    if (!gameState || isAITurn || isProcessingAI || humanTurnComplete || legWinnerInfo) return;

    const throwData: DartThrow = {
      segment,
      playerId: currentPlayer!.id,
      timestamp: Date.now(),
    };

    recordThrow(throwData);
  }, [gameState, isAITurn, isProcessingAI, currentPlayer, recordThrow, humanTurnComplete, legWinnerInfo]);

  // Handle game end
  const handleEndGame = useCallback(() => {
    const history = endGame();
    if (history) {
      addGameHistory(history);
    }
    onGameEnd();
  }, [endGame, addGameHistory, onGameEnd]);

  // Handle rematch - start new game with same players and rules
  const handleRematch = useCallback(() => {
    if (!gameState) return;
    
    // Save the current game first
    const history = endGame();
    if (history) {
      addGameHistory(history);
    }
    
    // Create fresh players with new IDs but same settings
    const freshPlayers = gameState.players.map(player => ({
      ...player,
      id: `${player.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }));
    
    // Start new game with same rules and fresh players
    const { startGame } = useGameStore.getState();
    startGame(gameState.rules, freshPlayers);
  }, [gameState, endGame, addGameHistory]);

  // Handle quit without saving
  const handleQuit = useCallback(() => {
    resetGame();
    onGameEnd();
  }, [resetGame, onGameEnd]);

  if (!gameState || !currentLeg) {
    return <div className="text-white">Loading game...</div>;
  }

  // Check for match winner - show game winner screen
  if (gameState.matchWinnerId) {
    const gameStats = calculateGameStats();
    
    return (
      <GameWinnerScreen
        gameState={gameState}
        gameStats={gameStats}
        onFinish={handleEndGame}
        onRematch={handleRematch}
      />
    );
  }

  // Current turn total
  const currentTurnTotal = currentTurnThrows.reduce((sum, t) => sum + (t.segment?.points || 0), 0);

  // Get throws to display on dartboard - only show AI throws with coordinates during AI turn
  const dartboardThrows = isAITurn ? aiTurnThrows.filter(t => t.coordinates) : [];

  // Calculate checkout path highlighting for X01 games
  const getCheckoutHighlightedSegments = (): DartboardSegment[] => {
    // Only for X01 games and human players
    if (gameState.rules.gameType === 'cricket' || isAITurn) return [];
    
    const currentScore = currentLeg.scores[currentPlayer!.id] as X01Score;
    if (!currentScore || currentScore.remaining > 170 || currentScore.remaining < 2) return [];
    
    // Check if player needs to double in first
    if (gameState.rules.doubleIn && !currentScore.hasDoubledIn) {
      // Highlight all doubles when needing to double in
      return [];
    }
    
    const dartsLeft = 3 - gameState.currentThrowInTurn;
    if (dartsLeft <= 0) return [];
    
    const checkoutPath = getCheckoutPath(currentScore.remaining, preferredDouble, dartsLeft);
    if (!checkoutPath?.possible || checkoutPath.darts.length === 0) return [];
    
    // Highlight the next dart to throw (first in the path)
    return [checkoutPath.darts[0]];
  };

  // Calculate unclosed number highlighting for Cricket games
  const getCricketHighlightedSegments = (): DartboardSegment[] => {
    // Only for Cricket games and human players
    if (gameState.rules.gameType !== 'cricket' || isAITurn) return [];
    
    const currentScore = currentLeg.scores[currentPlayer!.id] as CricketScore;
    if (!currentScore) return [];
    
    const cricketNumbers = [20, 19, 18, 17, 16, 15];
    const highlighted: DartboardSegment[] = [];
    
    // Highlight ALL segments of each unclosed number (double, outer single, triple, inner single)
    cricketNumbers.forEach(num => {
      const mark = currentScore.marks.find(m => m.number === num);
      if (!mark || !mark.closed) {
        // Add all 4 segment types for this number
        highlighted.push(
          { number: num, type: 'double', points: num * 2, multiplier: 2 },
          { number: num, type: 'single', points: num, multiplier: 1 },
          { number: num, type: 'triple', points: num * 3, multiplier: 3 },
        );
      }
    });
    
    // Check Bull (25) - highlight both inner and outer bull if not closed
    const bullMark = currentScore.marks.find(m => m.number === 25);
    if (!bullMark || !bullMark.closed) {
      highlighted.push(
        { number: 25, type: 'inner-bull', points: 50, multiplier: 2 },
        { number: 25, type: 'outer-bull', points: 25, multiplier: 1 },
      );
    }
    
    return highlighted;
  };

  const highlightedSegments = gameState.rules.gameType === 'cricket' 
    ? getCricketHighlightedSegments() 
    : getCheckoutHighlightedSegments();

  // Current Turn Info Component (used in both normal and fullscreen mode)
  const CurrentTurnInfo = ({ compact = false }: { compact?: boolean }) => (
    <div className={`bg-bg-elevated rounded-xl ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`${compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-full flex items-center justify-center text-white font-bold`}
          style={{ backgroundColor: currentPlayer?.color }}
        >
          {currentPlayer?.type === 'ai' ? '🤖' : currentPlayer?.name[0].toUpperCase()}
        </div>
        <span className={`text-white font-medium ${compact ? 'text-sm' : ''}`}>
          {currentPlayer?.name}
        </span>
        {isAITurn && (
          <span className="text-neon-yellow animate-pulse text-sm">Throwing...</span>
        )}
      </div>
      
      <div className="flex gap-2">
        {[0, 1, 2].map(i => {
          const throwData = currentTurnThrows[i];
          const isActive = i === gameState.currentThrowInTurn;
          const isComplete = i < gameState.currentThrowInTurn;
          const showPoints = gameState.rules.gameType !== 'cricket';

          return (
            <div
              key={i}
              className={`flex-1 ${compact ? 'p-2' : 'p-3'} rounded-lg text-center transition-all ${
                isActive
                  ? 'bg-neon-green/20 ring-2 ring-neon-green'
                  : isComplete
                  ? 'bg-bg-dark'
                  : 'bg-bg-dark/50'
              }`}
            >
              <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-white/40 mb-1`}>Dart {i + 1}</p>
              <p className={`font-bold ${compact ? 'text-sm' : ''} ${throwData ? 'text-white' : 'text-white/20'}`}>
                {throwData ? formatSegment(throwData.segment) : '-'}
              </p>
              {/* Points row - always reserve space for X01 games to prevent layout shift */}
              {showPoints && (
                <p className={`text-neon-green ${compact ? 'text-xs' : 'text-sm'} ${compact ? 'h-4' : 'h-5'}`}>
                  {throwData?.segment ? throwData.segment.points : '\u00A0'}
                </p>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Turn Total - only show for X01 games */}
      {gameState.rules.gameType !== 'cricket' && (
        <div className={`${compact ? 'mt-2' : 'mt-3'} text-center`}>
          <p className={`text-white/60 ${compact ? 'text-xs' : 'text-sm'}`}>Turn Total</p>
          <p className={`${compact ? 'text-xl' : 'text-2xl'} font-bold text-white`}>{currentTurnTotal}</p>
        </div>
      )}

      {humanTurnComplete && (
        <button
          onClick={nextTurn}
          className={`w-full ${compact ? 'mt-2 py-2 text-sm' : 'mt-3 py-3'} bg-gradient-to-r from-neon-green to-neon-blue rounded-lg text-black font-bold hover:opacity-90 transition-all animate-pulse`}
        >
          Next Player →
        </button>
      )}
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Sidebar - Game Info */}
      {!isFullscreen && (
        <div className="w-72 flex-shrink-0 bg-bg-card border-r border-white/10 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-white tracking-tight">
                {gameState.rules.gameType === 'cricket' ? 'Cricket' : gameState.rules.gameType}
              </h1>
              <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg px-2.5 py-1">
                <span className="text-neon-green font-bold text-sm">
                  Leg {gameState.currentLegIndex + 1}
                  <span className="text-white/40 font-normal"> / {gameState.rules.bestOf}</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowEndGameModal(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-red-500/20 hover:border-red-500/50 text-white/40 hover:text-red-400 transition-all duration-200"
              title="End game"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Current Turn */}
          <div className="p-4 border-b border-white/10">
            <CurrentTurnInfo />
          </div>

          {/* Player Scores */}
          <div className="flex-1 p-4 overflow-y-auto">
            {gameState.rules.gameType === 'cricket' ? (
              <CricketScoreboard
                players={gameState.players}
                scores={currentLeg.scores as Record<string, CricketScore>}
                currentPlayerId={currentPlayer!.id}
                currentThrowInTurn={gameState.currentThrowInTurn}
                recentThrows={currentTurnThrows}
                variant={gameState.rules.cricketVariant || 'standard'}
                legsWon={gameState.legsWon}
              />
            ) : (
              <X01Scoreboard
                players={gameState.players}
                scores={currentLeg.scores as Record<string, X01Score>}
                currentPlayerId={currentPlayer!.id}
                currentThrowInTurn={gameState.currentThrowInTurn}
                recentThrows={currentTurnThrows}
                rules={gameState.rules}
                legsWon={gameState.legsWon}
                preferredDouble={preferredDouble}
                onPreferredDoubleChange={setPreferredDouble}
              />
            )}
          </div>
        </div>
      )}

      {/* Main Area - Dartboard */}
      <div className={`flex-1 flex flex-col ${isFullscreen ? 'bg-black' : ''}`}>
        {/* Fullscreen top bar - NOT overlapping dartboard */}
        {isFullscreen && (
          <div className="flex-shrink-0 bg-bg-card border-b border-white/10 px-3 py-1.5">
            <div className="flex items-center justify-between">
              {/* Player scores - left */}
              <div className="flex items-center gap-2">
                {gameState.players.map(player => {
                  const score = currentLeg.scores[player.id];
                  const isActive = player.id === currentPlayer?.id;
                  const displayScore = gameState.rules.gameType === 'cricket' 
                    ? (score as CricketScore).points 
                    : (score as X01Score).remaining;

                  return (
                    <div
                      key={player.id}
                      className={`px-3 h-10 flex flex-col justify-center rounded-lg ${isActive ? 'bg-neon-green/20 ring-1 ring-neon-green' : 'bg-bg-elevated'}`}
                    >
                      <p className="text-white/50 text-[10px] leading-none">{player.name}</p>
                      <p className={`text-lg font-bold leading-tight ${isActive ? 'text-neon-green' : 'text-white'}`}>
                        {displayScore}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Current turn throws - center */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => {
                  const throwData = currentTurnThrows[i];
                  const isActive = i === gameState.currentThrowInTurn;
                  const isComplete = i < gameState.currentThrowInTurn;

                  return (
                    <div
                      key={i}
                      className={`w-12 h-10 flex items-center justify-center rounded-lg text-sm font-bold ${
                        isActive
                          ? 'bg-neon-green/20 ring-1 ring-neon-green text-white'
                          : isComplete
                          ? 'bg-bg-elevated text-white'
                          : 'bg-bg-dark text-white/30'
                      }`}
                    >
                      {throwData ? formatSegment(throwData.segment) : '-'}
                    </div>
                  );
                })}
                {/* Turn total for X01 */}
                {gameState.rules.gameType !== 'cricket' && (
                  <div className="ml-2 px-3 h-10 flex flex-col items-center justify-center bg-bg-elevated rounded-lg">
                    <p className="text-[9px] text-white/50 leading-none">Total</p>
                    <p className="text-base font-bold text-white leading-none">{currentTurnTotal}</p>
                  </div>
                )}
              </div>

              {/* Close button - right */}
              <button
                onClick={() => setIsFullscreen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/10 bg-bg-elevated hover:bg-red-500/20 hover:border-red-500/50 text-white/50 hover:text-red-400 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Dartboard container - takes remaining space */}
        <div className="flex-1 relative min-h-0 overflow-hidden">
          <Dartboard
            onThrow={handleThrow}
            disabled={isAITurn || isProcessingAI || humanTurnComplete || !!legWinnerInfo}
            recentThrows={dartboardThrows}
            highlightedSegments={highlightedSegments}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            onCorrect={undoLastThrow}
            canCorrect={currentLeg.throws.length > 0 && !isAITurn}
            aiVisualization={aiVisualization}
          />

          {/* Next player button - bottom center, only when needed */}
          {isFullscreen && humanTurnComplete && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={nextTurn}
                className="px-8 py-3 bg-gradient-to-r from-neon-green to-neon-blue rounded-xl text-black font-bold hover:opacity-90 transition-all animate-pulse shadow-lg"
              >
                Next Player →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leg Winner Modal */}
      {legWinnerInfo && (
        <LegWinnerModal
          legStats={legWinnerInfo}
          players={gameState.players}
          gameState={gameState}
          onContinue={continueLeg}
        />
      )}

      {/* End Game Modal */}
      {showEndGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-bg-card rounded-2xl p-6 max-w-sm w-full animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">End Game?</h2>
            <p className="text-white/60 mb-6">
              Do you want to save this game to history or quit without saving?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleEndGame}
                className="w-full py-3 bg-neon-green rounded-xl text-black font-bold hover:opacity-90 transition-all"
              >
                Save & Exit
              </button>
              <button
                onClick={handleQuit}
                className="w-full py-3 bg-red-500/20 rounded-xl text-red-400 font-medium hover:bg-red-500/30 transition-all"
              >
                Quit Without Saving
              </button>
              <button
                onClick={() => setShowEndGameModal(false)}
                className="w-full py-3 bg-bg-elevated rounded-xl text-white/60 hover:text-white transition-all"
              >
                Continue Playing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bust Notification */}
      {showBustNotification && bustInfo && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-red-600 text-white px-8 py-6 rounded-2xl shadow-2xl animate-fade-in text-center">
            <div className="text-5xl mb-2">💥</div>
            <h2 className="text-3xl font-black mb-2">BUST!</h2>
            <p className="text-white/80">
              Score reset to {bustInfo.scoreBeforeBust}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameView;
