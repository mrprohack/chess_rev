import React, { useState } from 'react';
import './App.css';
import BoardArea from './components/BoardArea';
import RightPanel from './components/RightPanel';

function App() {
  const [gameData, setGameData] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);

  return (
    <div className="layout-container">
      <div className="main-content">
        <BoardArea gameData={gameData} currentMoveIndex={currentMoveIndex} />
        <RightPanel 
          gameData={gameData} 
          setGameData={setGameData}
          currentMoveIndex={currentMoveIndex}
          setCurrentMoveIndex={setCurrentMoveIndex}
        />
      </div>
    </div>
  );
}

export default App;
