'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '../../stores/gameStore';
import GameWizard from '../../components/wizard/GameWizard';
import { GameRules, Player } from '../../types';

export default function GameWizardPage() {
  const router = useRouter();
  const startGame = useGameStore((state) => state.startGame);

  const handleComplete = (rules: GameRules, players: Player[]) => {
    startGame(rules, players);
    router.push('/game');
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <GameWizard
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}

