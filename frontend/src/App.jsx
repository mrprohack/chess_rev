import React, { useState, useEffect } from 'react';
import './App.css';
import BoardArea from './components/BoardArea';
import RightPanel from './components/RightPanel';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';

function App() {
  const [gameData, setGameData] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [engineDepth, setEngineDepth] = useState(10);

  useEffect(() => {
    const applyTheme = (t) => {
      if (t === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', t);
      }
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <div className="layout-container">
      <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />
      <div className="main-content">
        <BoardArea 
          gameData={gameData} 
          currentMoveIndex={currentMoveIndex} 
        />
        <RightPanel 
          gameData={gameData} 
          setGameData={setGameData}
          currentMoveIndex={currentMoveIndex}
          setCurrentMoveIndex={setCurrentMoveIndex}
          engineDepth={engineDepth}
        />
      </div>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        engineDepth={engineDepth}
        setEngineDepth={setEngineDepth}
      />
    </div>
  );
}

export default App;

