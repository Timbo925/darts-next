'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../stores/gameStore';
import { useUserStore } from '../stores/userStore';
import GameView from '../components/game/GameView';

export default function GamePage() {
  const router = useRouter();
  const gameState = useGameStore((state) => state.gameState);
  const { addGameHistory } = useUserStore();
  const endGame = useGameStore((state) => state.endGame);

  useEffect(() => {
    if (!gameState) {
      router.push('/');
    }
  }, [gameState, router]);

  const handleGameEnd = () => {
    const history = endGame();
    if (history) {
      addGameHistory(history);
    }
    router.push('/');
  };

  if (!gameState) {
    return null;
  }

  return <GameView onGameEnd={handleGameEnd} />;
}

