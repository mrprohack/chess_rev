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
  const [isFlipped, setIsFlipped] = useState(false);

  // Settings state with localStorage persistence
  const [theme, setTheme] = useState(() => localStorage.getItem('chess_theme') || 'dark');
  const [engineDepth, setEngineDepth] = useState(() => Number(localStorage.getItem('chess_engineDepth')) || 10);
  const [boardTheme, setBoardTheme] = useState(() => localStorage.getItem('chess_boardTheme') || 'wood');
  const [showArrows, setShowArrows] = useState(() => localStorage.getItem('chess_showArrows') !== 'false');
  const [showCoordinates, setShowCoordinates] = useState(() => localStorage.getItem('chess_showCoordinates') !== 'false');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('chess_soundEnabled') !== 'false');
  const [soundVolume, setSoundVolume] = useState(() => Number(localStorage.getItem('chess_soundVolume') ?? 0.8));
  const [soundTheme, setSoundTheme] = useState(() => localStorage.getItem('chess_soundTheme') || 'classic');
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(() => Number(localStorage.getItem('chess_autoPlaySpeed')) || 1000);
  const [figurineNotation, setFigurineNotation] = useState(() => localStorage.getItem('chess_figurineNotation') !== 'false');

  // New Analysis Engine Settings
  const [chessEngine, setChessEngine] = useState(() => localStorage.getItem('chess_engineSelect') || 'stockfish18');
  const [maxTime, setMaxTime] = useState(() => Number(localStorage.getItem('chess_maxTime')) || 5);
  const [numLines, setNumLines] = useState(() => Number(localStorage.getItem('chess_numLines')) || 3);
  const [threads, setThreads] = useState(() => Number(localStorage.getItem('chess_threads')) || 1);

  useEffect(() => {
    localStorage.setItem('chess_theme', theme);
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

  useEffect(() => { localStorage.setItem('chess_engineDepth', engineDepth); }, [engineDepth]);
  useEffect(() => { localStorage.setItem('chess_boardTheme', boardTheme); }, [boardTheme]);
  useEffect(() => { localStorage.setItem('chess_showArrows', showArrows); }, [showArrows]);
  useEffect(() => { localStorage.setItem('chess_showCoordinates', showCoordinates); }, [showCoordinates]);
  useEffect(() => { localStorage.setItem('chess_soundEnabled', soundEnabled); }, [soundEnabled]);
  useEffect(() => { localStorage.setItem('chess_soundVolume', soundVolume); }, [soundVolume]);
  useEffect(() => { localStorage.setItem('chess_soundTheme', soundTheme); }, [soundTheme]);
  useEffect(() => { localStorage.setItem('chess_autoPlaySpeed', autoPlaySpeed); }, [autoPlaySpeed]);
  useEffect(() => { localStorage.setItem('chess_figurineNotation', figurineNotation); }, [figurineNotation]);
  useEffect(() => { localStorage.setItem('chess_engineSelect', chessEngine); }, [chessEngine]);
  useEffect(() => { localStorage.setItem('chess_maxTime', maxTime); }, [maxTime]);
  useEffect(() => { localStorage.setItem('chess_numLines', numLines); }, [numLines]);
  useEffect(() => { localStorage.setItem('chess_threads', threads); }, [threads]);

  // Global Arrow Key Navigation for Chess Moves
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture keys if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      const maxMoves = gameData?.moves?.length || 0;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentMoveIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentMoveIndex(prev => Math.min(maxMoves, prev + 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentMoveIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentMoveIndex(maxMoves);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameData]);

  return (
    <div className="layout-container">
      <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />
      <div className="main-content">
        <BoardArea 
          gameData={gameData} 
          currentMoveIndex={currentMoveIndex} 
          isFlipped={isFlipped}
          boardTheme={boardTheme}
          showArrows={showArrows}
          showCoordinates={showCoordinates}
        />
        <RightPanel 
          gameData={gameData} 
          setGameData={setGameData}
          currentMoveIndex={currentMoveIndex}
          setCurrentMoveIndex={setCurrentMoveIndex}
          engineDepth={engineDepth}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isFlipped={isFlipped}
          onToggleFlip={() => setIsFlipped(prev => !prev)}
          soundEnabled={soundEnabled}
          soundVolume={soundVolume}
          soundTheme={soundTheme}
          autoPlaySpeed={autoPlaySpeed}
          figurineNotation={figurineNotation}
          chessEngine={chessEngine}
          maxTime={maxTime}
          numLines={numLines}
          threads={threads}
        />
      </div>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        engineDepth={engineDepth}
        setEngineDepth={setEngineDepth}
        boardTheme={boardTheme}
        setBoardTheme={setBoardTheme}
        showArrows={showArrows}
        setShowArrows={setShowArrows}
        showCoordinates={showCoordinates}
        setShowCoordinates={setShowCoordinates}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        soundVolume={soundVolume}
        setSoundVolume={setSoundVolume}
        soundTheme={soundTheme}
        setSoundTheme={setSoundTheme}
        autoPlaySpeed={autoPlaySpeed}
        setAutoPlaySpeed={setAutoPlaySpeed}
        figurineNotation={figurineNotation}
        setFigurineNotation={setFigurineNotation}
        chessEngine={chessEngine}
        setChessEngine={setChessEngine}
        maxTime={maxTime}
        setMaxTime={setMaxTime}
        numLines={numLines}
        setNumLines={setNumLines}
        threads={threads}
        setThreads={setThreads}
      />
    </div>
  );
}

export default App;


