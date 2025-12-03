'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from './stores/gameStore';
import HomeScreen from './components/home/HomeScreen';
import SettingsModal from './components/settings/SettingsModal';

export default function HomePage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const { loadSavedGame } = useGameStore();

  const handleNewGame = () => {
    router.push('/game/wizard');
  };

  const handleContinueGame = () => {
    loadSavedGame();
    router.push('/game');
  };

  const handleViewHistory = () => {
    router.push('/history');
  };

  const handleViewProfile = () => {
    router.push('/profile');
  };

  return (
    <>
      <HomeScreen
        onNewGame={handleNewGame}
        onContinueGame={handleContinueGame}
        onViewHistory={handleViewHistory}
        onViewProfile={handleViewProfile}
        onOpenSettings={() => setShowSettings(true)}
      />
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}

