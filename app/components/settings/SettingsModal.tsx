'use client';

import React from 'react';
import { useUserStore } from '../../stores/userStore';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { users, gameHistory, aiSettings, updateAISettings } = useUserStore();

  const handleMultiplierChange = (value: number) => {
    updateAISettings({
      ...aiSettings,
      globalMultiplier: value,
    });
  };

  const handleVisualizationToggle = () => {
    updateAISettings({
      ...aiSettings,
      showVisualization: !aiSettings.showVisualization,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-bg-card rounded-2xl p-6 max-w-md w-full animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-elevated rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* AI Difficulty Calibration */}
        <div className="bg-bg-elevated rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white font-medium">AI Difficulty Calibration</span>
            <span className="px-2 py-0.5 bg-neon-yellow/20 text-neon-yellow text-xs rounded-full">
              Debug
            </span>
          </div>
          <p className="text-white/40 text-sm mb-4">
            Adjust the global accuracy multiplier for all AI difficulty levels. 
            Lower values make AI more accurate, higher values make them less accurate.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Global Multiplier</span>
              <span className="text-neon-green font-bold text-xl">{aiSettings.globalMultiplier.toFixed(2)}x</span>
            </div>

            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={aiSettings.globalMultiplier}
              onChange={(e) => handleMultiplierChange(parseFloat(e.target.value))}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
            />

            <div className="flex justify-between text-xs text-white/40">
              <span>0.5x (More Accurate)</span>
              <span>1.0x</span>
              <span>2.0x (Less Accurate)</span>
            </div>

            {/* Visual indicator */}
            <div className="bg-bg-dark rounded-lg p-3">
              <p className="text-white/60 text-xs mb-2">Effect on AI:</p>
              <div className="flex items-center gap-3">
                <div 
                  className="rounded-full bg-neon-red/30 border-2 border-neon-red flex items-center justify-center"
                  style={{
                    width: `${Math.min(80, 20 + aiSettings.globalMultiplier * 30)}px`,
                    height: `${Math.min(80, 20 + aiSettings.globalMultiplier * 30)}px`,
                  }}
                >
                  <div className="w-2 h-2 bg-neon-green rounded-full" />
                </div>
                <div className="text-white/60 text-sm">
                  <p>Accuracy disc size</p>
                  <p className="text-white/40 text-xs">
                    {aiSettings.globalMultiplier < 1 ? 'Smaller = more accurate throws' :
                     aiSettings.globalMultiplier > 1 ? 'Larger = more scattered throws' :
                     'Default accuracy'}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Visualization Toggle */}
            <div className="bg-bg-dark rounded-lg p-3 mt-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Show AI Visualization</p>
                  <p className="text-white/40 text-xs">Display target & accuracy disc during AI turns</p>
                </div>
                <button
                  onClick={handleVisualizationToggle}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    aiSettings.showVisualization ? 'bg-neon-green' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      aiSettings.showVisualization ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => handleMultiplierChange(1.0)}
          className="w-full py-3 bg-bg-elevated rounded-xl text-white/60 hover:text-white font-medium transition-all mb-4"
        >
          Reset to Default (1.0x)
        </button>

        {/* Storage Info */}
        <div className="bg-bg-elevated rounded-xl p-4 mb-4">
          <h3 className="text-white font-medium mb-2">Storage (Zustand + localStorage)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Players</span>
              <span className="text-white">{users.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Games in History</span>
              <span className="text-white">{gameHistory.length}</span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="text-center text-white/40 text-sm">
          <p>Darts Scorer v1.0</p>
          <p>All data stored locally with Zustand</p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-neon-green rounded-xl text-black font-bold hover:opacity-90 transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
