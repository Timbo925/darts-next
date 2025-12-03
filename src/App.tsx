import { useState } from 'react';
import { useGameStore } from './stores/gameStore';
import HomeScreen from './components/home/HomeScreen';
import GameWizard from './components/wizard/GameWizard';
import GameView from './components/game/GameView';
import HistoryScreen from './components/history/HistoryScreen';
import ProfileScreen from './components/profile/ProfileScreen';
import SettingsModal from './components/settings/SettingsModal';
import { GameRules, Player } from './types';

type AppView = 'home' | 'wizard' | 'game' | 'history' | 'profile';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [showSettings, setShowSettings] = useState(false);
  const startGame = useGameStore((state) => state.startGame);

  const handleStartGame = (rules: GameRules, players: Player[]) => {
    startGame(rules, players);
    setCurrentView('game');
  };

  const handleGameEnd = () => {
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen">
      {currentView === 'home' && (
        <HomeScreen
          onNewGame={() => setCurrentView('wizard')}
          onContinueGame={() => setCurrentView('game')}
          onViewHistory={() => setCurrentView('history')}
          onViewProfile={() => setCurrentView('profile')}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {currentView === 'wizard' && (
        <GameWizard
          onComplete={handleStartGame}
          onCancel={() => setCurrentView('home')}
        />
      )}

      {currentView === 'game' && (
        <GameView onGameEnd={handleGameEnd} />
      )}

      {currentView === 'history' && (
        <HistoryScreen onBack={() => setCurrentView('home')} />
      )}

      {currentView === 'profile' && (
        <ProfileScreen onBack={() => setCurrentView('home')} />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;
