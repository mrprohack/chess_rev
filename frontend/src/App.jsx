import React, { useEffect, useState } from 'react';
import './App.css';
import './ReviewEnhancements.css';
import BoardArea from './components/BoardArea';
import RightPanel from './components/RightPanel';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import GameHistory from './components/GameHistory';
import {
  bookmarkStorageKey,
  getPlayerPerspective,
  normalizeUsername,
  toggleBookmark,
} from './utils/review';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';
const PROFILE_STORAGE_KEY = 'chess_chesscom_username';
const profileRequestCache = new Map();

async function fetchChessComProfile(username, limit = 12) {
  const safeLimit = Math.min(20, Math.max(1, Number(limit) || 12));
  const cacheKey = `${normalizeUsername(username).toLowerCase()}:${safeLimit}`;
  const cached = profileRequestCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < 5000) return cached.promise;

  const request = (async () => {
    const response = await fetch(`${API_BASE}/api/chesscom/profile/${encodeURIComponent(username)}?limit=${safeLimit}`);
    const body = await response.json();
    if (!response.ok) throw new Error(body.detail || 'Could not load Chess.com profile');
    return body;
  })();

  profileRequestCache.set(cacheKey, { promise: request, createdAt: Date.now() });
  try {
    return await request;
  } catch (error) {
    profileRequestCache.delete(cacheKey);
    throw error;
  }
}

function readBookmarks(gameUrl) {
  if (!gameUrl) return [];
  try {
    const value = JSON.parse(localStorage.getItem(bookmarkStorageKey(gameUrl)) || '[]');
    return Array.isArray(value) ? value.filter(Number.isInteger).sort((a, b) => a - b) : [];
  } catch {
    return [];
  }
}

function App() {
  const [gameData, setGameData] = useState(null);
  const [currentGameUrl, setCurrentGameUrl] = useState('');
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [bookmarks, setBookmarks] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeView, setActiveView] = useState('review');
  const [isReviewPanelVisible, setIsReviewPanelVisible] = useState(true);
  const [pendingHistoryGameUrl, setPendingHistoryGameUrl] = useState('');

  const [defaultChessUsername, setDefaultChessUsername] = useState(
    () => normalizeUsername(localStorage.getItem(PROFILE_STORAGE_KEY)),
  );
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

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

  // Analysis Engine Settings
  const [chessEngine, setChessEngine] = useState(() => localStorage.getItem('chess_engineSelect') || 'stockfish18');
  const [maxTime, setMaxTime] = useState(() => Number(localStorage.getItem('chess_maxTime')) || 5);
  const [numLines, setNumLines] = useState(() => Number(localStorage.getItem('chess_numLines')) || 3);
  const [threads, setThreads] = useState(() => Number(localStorage.getItem('chess_threads')) || 1);

  async function loadChessProfile(requestedUsername, { persist = true, limit = 12 } = {}) {
    const username = normalizeUsername(requestedUsername);
    if (!username) {
      setProfileError('Enter a Chess.com username.');
      return null;
    }

    setProfileLoading(true);
    setProfileError('');
    try {
      const body = await fetchChessComProfile(username, limit);
      const canonicalUsername = normalizeUsername(body.username || username);
      setProfileData(body);
      setDefaultChessUsername(canonicalUsername);
      if (persist) localStorage.setItem(PROFILE_STORAGE_KEY, canonicalUsername);
      const perspective = getPlayerPerspective(gameData, canonicalUsername);
      if (perspective) setIsFlipped(perspective === 'black');
      return body;
    } catch (error) {
      setProfileData(null);
      setProfileError(error.message || 'Could not load Chess.com profile');
      return null;
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    const saved = normalizeUsername(localStorage.getItem(PROFILE_STORAGE_KEY));
    if (saved) loadChessProfile(saved, { persist: false });
  }, []);

  useEffect(() => {
    localStorage.setItem('chess_theme', theme);
    const applyTheme = (nextTheme) => {
      if (nextTheme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', nextTheme);
      }
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    return undefined;
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

  const handleGameLoaded = (data, sourceUrl) => {
    const username = defaultChessUsername || profileData?.username || '';
    const perspective = getPlayerPerspective(data, username);
    if (perspective) setIsFlipped(perspective === 'black');

    setGameData(data);
    setCurrentGameUrl(sourceUrl || '');
    setCurrentMoveIndex(0);
    setBookmarks(readBookmarks(sourceUrl));
  };

  const refreshHistory = async () => {
    if (!defaultChessUsername) {
      setIsSettingsOpen(true);
      return null;
    }
    return loadChessProfile(defaultChessUsername, { persist: false, limit: 20 });
  };

  const openHistoryGame = (gameUrl) => {
    if (!gameUrl) return;
    setPendingHistoryGameUrl(gameUrl);
    setActiveView('review');
    setIsReviewPanelVisible(true);
  };

  const toggleCurrentBookmark = () => {
    if (!currentGameUrl || currentMoveIndex < 1) return;
    setBookmarks((previous) => {
      const next = toggleBookmark(previous, currentMoveIndex);
      localStorage.setItem(bookmarkStorageKey(currentGameUrl), JSON.stringify(next));
      return next;
    });
  };

  // Global keyboard navigation for chess moves and quick bookmarking.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      const maxMoves = gameData?.moves?.length || 0;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentMoveIndex((previous) => Math.max(0, previous - 1));
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentMoveIndex((previous) => Math.min(maxMoves, previous + 1));
      } else if (event.key === 'Home') {
        event.preventDefault();
        setCurrentMoveIndex(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        setCurrentMoveIndex(maxMoves);
      } else if (event.key.toLowerCase() === 'b' && currentMoveIndex > 0 && currentGameUrl) {
        event.preventDefault();
        toggleCurrentBookmark();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameData, currentMoveIndex, currentGameUrl]);

  return (
    <div className="layout-container">
      <Sidebar
        activeView={activeView}
        onChangeView={(view) => {
          setActiveView(view);
          if (view === 'history' && defaultChessUsername) refreshHistory();
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <div className={`main-content ${activeView === 'review' && !isReviewPanelVisible ? 'review-panel-hidden' : ''}`}>
        {activeView === 'history' ? (
          <GameHistory
            username={defaultChessUsername}
            profile={profileData}
            loading={profileLoading}
            error={profileError}
            onRefresh={refreshHistory}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onSelectGame={openHistoryGame}
          />
        ) : (
          <>
            <BoardArea
              gameData={gameData}
              currentMoveIndex={currentMoveIndex}
              isFlipped={isFlipped}
              boardTheme={boardTheme}
              showArrows={showArrows}
              showCoordinates={showCoordinates}
              profileUsername={defaultChessUsername}
              profileAvatar={profileData?.avatar || ""}
            />
            {isReviewPanelVisible ? (
              <RightPanel
                gameData={gameData}
                onGameLoaded={handleGameLoaded}
                currentMoveIndex={currentMoveIndex}
                setCurrentMoveIndex={setCurrentMoveIndex}
                engineDepth={engineDepth}
                onOpenSettings={() => setIsSettingsOpen(true)}
                isFlipped={isFlipped}
                onToggleFlip={() => setIsFlipped((previous) => !previous)}
                soundEnabled={soundEnabled}
                soundVolume={soundVolume}
                soundTheme={soundTheme}
                autoPlaySpeed={autoPlaySpeed}
                figurineNotation={figurineNotation}
                chessEngine={chessEngine}
                maxTime={maxTime}
                numLines={numLines}
                threads={threads}
                bookmarks={bookmarks}
                onToggleBookmark={toggleCurrentBookmark}
                onHideReview={() => setIsReviewPanelVisible(false)}
                requestedUrl={pendingHistoryGameUrl}
                onRequestedUrlConsumed={() => setPendingHistoryGameUrl('')}
              />
            ) : (
              <button
                type="button"
                className="show-review-btn"
                onClick={() => setIsReviewPanelVisible(true)}
                aria-expanded="false"
              >
                Show Review
              </button>
            )}
          </>
        )}
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
        profileUsername={defaultChessUsername}
        profileData={profileData}
        profileLoading={profileLoading}
        profileError={profileError}
        onLoadProfile={loadChessProfile}
      />
    </div>
  );
}

export default App;
