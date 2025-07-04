'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Flag, Bomb, RotateCcw, Clock, AlertOctagon } from 'lucide-react';

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

type GameStatus = 'playing' | 'won' | 'lost';
type Difficulty = 'beginner' | 'intermediate' | 'expert';

interface GameConfig {
  rows: number;
  cols: number;
  mines: number;
}

const DIFFICULTY: Record<Difficulty, GameConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

export default function Minesweeper({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [flagsPlaced, setFlagsPlaced] = useState(0);
  const [time, setTime] = useState(0);
  const [isFirstClick, setIsFirstClick] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout>();
  const { rows, cols, mines } = DIFFICULTY[difficulty];
  const minesLeft = mines - flagsPlaced;
  
  // Initialize the board
  const initializeBoard = useCallback(() => {
    const newBoard: Cell[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < cols; j++) {
        row.push({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newBoard.push(row);
    }
    return newBoard;
  }, [rows, cols]);
  
  // Place mines on the board after first click
  const placeMines = useCallback((board: Cell[][], firstClickRow: number, firstClickCol: number) => {
    const newBoard = JSON.parse(JSON.stringify(board));
    let minesPlaced = 0;
    
    // Place mines randomly, ensuring the first click is safe
    while (minesPlaced < mines) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      
      // Skip if this is the first click cell or already has a mine
      if ((row === firstClickRow && col === firstClickCol) || newBoard[row][col].isMine) {
        continue;
      }
      
      newBoard[row][col].isMine = true;
      minesPlaced++;
    }
    
    // Calculate neighbor mines
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!newBoard[i][j].isMine) {
          let count = 0;
          // Check all 8 neighbors
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              if (di === 0 && dj === 0) continue;
              const ni = i + di;
              const nj = j + dj;
              if (ni >= 0 && ni < rows && nj >= 0 && nj < cols && newBoard[ni][nj].isMine) {
                count++;
              }
            }
          }
          newBoard[i][j].neighborMines = count;
        }
      }
    }
    
    return newBoard;
  }, [mines, rows, cols]);
  
  // Initialize game
  const initGame = useCallback(() => {
    const newBoard = initializeBoard();
    setBoard(newBoard);
    setGameStatus('playing');
    setFlagsPlaced(0);
    setTime(0);
    setIsFirstClick(true);
    setIsPaused(false);
    setGameStarted(false);
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    
    return newBoard;
  }, [initializeBoard]);
  
  // Initialize board on mount and when difficulty changes
  useEffect(() => {
    initGame();
  }, [difficulty, initGame]);
  
  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (gameStatus !== 'playing' || isPaused) return;
    
    // Start game on first click
    if (!gameStarted) {
      setGameStarted(true);
    }
    
    // Place mines after first click to ensure first click is safe
    if (isFirstClick) {
      const newBoard = placeMines(board, row, col);
      setBoard(newBoard);
      setIsFirstClick(false);
      // Start timer after mines are placed
      startTimer();
      revealCell(newBoard, row, col);
      return;
    }
    
    // Don't reveal flagged cells
    if (board[row][col].isFlagged) return;
    
    // Reveal the cell
    revealCell([...board], row, col);
  };
  
  // Reveal a cell and handle game over or cascade
  const revealCell = (board: Cell[][], row: number, col: number) => {
    // Out of bounds or already revealed
    if (row < 0 || row >= rows || col < 0 || col >= cols || board[row][col].isRevealed) {
      return;
    }
    
    // Game over if mine is clicked
    if (board[row][col].isMine) {
      // Reveal all mines
      const newBoard = board.map(row => 
        row.map(cell => ({
          ...cell,
          isRevealed: cell.isMine ? true : cell.isRevealed
        }))
      );
      
      setBoard(newBoard);
      setGameStatus('lost');
      endGame(false);
      return;
    }
    
    // Reveal current cell
    board[row][col].isRevealed = true;
    
    // If it's an empty cell, reveal neighbors
    if (board[row][col].neighborMines === 0) {
      // Reveal all 8 neighbors
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          if (di === 0 && dj === 0) continue;
          revealCell(board, row + di, col + dj);
        }
      }
    }
    
    setBoard([...board]);
    checkWinCondition(board);
  };
  
  // Toggle flag on right click
  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    
    if (gameStatus !== 'playing' || isPaused || board[row][col].isRevealed) {
      return;
    }
    
    const newBoard = [...board];
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
    
    setBoard(newBoard);
    setFlagsPlaced(prev => newBoard[row][col].isFlagged ? prev + 1 : prev - 1);
  };
  
  // Check if player has won
  const checkWinCondition = (currentBoard: Cell[][]) => {
    // Check if all non-mine cells are revealed
    const hasWon = currentBoard.every(row =>
      row.every(cell => cell.isRevealed || cell.isMine)
    );
    
    if (hasWon) {
      setGameStatus('won');
      endGame(true);
    }
  };
  
  // Start the game timer
  const startTimer = useCallback(() => {
    // Clear any existing timer to prevent multiple timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Set up new timer
    timerRef.current = setInterval(() => {
      setTime(prev => {
        // Cap at 999 seconds
        if (prev >= 999) {
          clearInterval(timerRef.current);
          return 999;
        }
        return prev + 1;
      });
    }, 1000);
  }, []);
  
  // End the game
  const endGame = (won: boolean) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    
    // Calculate score based on time and difficulty
    const score = calculateScore(won, time, difficulty);
    onGameOver(score);
  };
  
  // Calculate score based on game result and time
  const calculateScore = (won: boolean, time: number, difficulty: Difficulty) => {
    if (!won) return 0;
    
    const difficultyMultipliers = {
      beginner: 1,
      intermediate: 2,
      expert: 4,
    };
    
    // Base score + time bonus (faster completion = higher score)
    const baseScore = 100 * difficultyMultipliers[difficulty];
    const timeBonus = Math.max(0, 500 - time * 2) * difficultyMultipliers[difficulty];
    
    return baseScore + timeBonus;
  };
  
  // Change difficulty
  const changeDifficulty = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    initGame();
  };
  
  // Initialize game on mount and clean up on unmount
  useEffect(() => {
    initGame();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [initGame]);
  
  // Calculate cell size based on difficulty
  const getCellSize = () => {
    if (difficulty === 'expert') return 'w-6 h-6 text-xs';
    if (difficulty === 'intermediate') return 'w-7 h-7 text-sm';
    return 'w-8 h-8 text-sm'; // beginner
  };

  // Calculate icon size based on difficulty
  const getIconSize = () => {
    if (difficulty === 'expert') return 'w-3 h-3';
    if (difficulty === 'intermediate') return 'w-3.5 h-3.5';
    return 'w-4 h-4'; // beginner
  };

  // Render cell with appropriate styling
  const renderCell = (cell: Cell, row: number, col: number) => {
    const cellSize = getCellSize();
    const iconSize = getIconSize();
    
    let cellContent = null;
    let cellClass = `${cellSize} flex items-center justify-center font-bold border border-gray-300 dark:border-gray-600 `;
    
    if (cell.isRevealed) {
      cellClass += 'bg-gray-200 dark:bg-gray-700 ';
      if (cell.isMine) {
        cellContent = <Bomb className={`${iconSize} text-red-600`} />;
      } else if (cell.neighborMines > 0) {
        const colors = [
          'text-blue-600', 'text-green-600', 'text-red-600',
          'text-purple-800', 'text-red-800', 'text-cyan-700',
          'text-black', 'text-gray-600'
        ];
        cellContent = (
          <span className={colors[cell.neighborMines - 1]}>
            {cell.neighborMines}
          </span>
        );
      }
    } else {
      cellClass += 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ';
      if (cell.isFlagged) {
        cellContent = <Flag className={`${iconSize} text-red-500`} />;
      }
    }
    
    // Add rounded corners to cells
    cellClass += 'rounded-sm ';
    
    return (
      <div
        key={`${row}-${col}`}
        className={cellClass}
        onClick={() => handleCellClick(row, col)}
        onContextMenu={(e) => handleRightClick(e, row, col)}
      >
        {cellContent}
      </div>
    );
  };
  
  // Render difficulty selector
  const renderDifficultySelector = () => (
    <div className="flex space-x-2 mb-4">
      {Object.entries(DIFFICULTY).map(([diff, config]) => (
        <button
          key={diff}
          onClick={() => changeDifficulty(diff as Difficulty)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            difficulty === diff
              ? 'bg-amber-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {diff.charAt(0).toUpperCase() + diff.slice(1)}
        </button>
      ))}
    </div>
  );
  
  // Render game info
  const renderGameInfo = () => (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
        <Flag className="w-4 h-4 text-red-500 mr-1" />
        <span className="font-mono text-gray-800 dark:text-gray-200">{Math.max(0, minesLeft).toString().padStart(2, '0')}</span>
      </div>
      
      <button
        onClick={() => initGame()}
        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
        aria-label="New Game"
      >
        <RotateCcw className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      </button>
      
      <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
        <Clock className="w-4 h-4 text-gray-700 dark:text-gray-200 mr-1" />
        <span className="font-mono text-gray-800 dark:text-gray-200">{time.toString().padStart(3, '0')}</span>
      </div>
    </div>
  );
  
  // Render game board
  const renderBoard = () => {
    // Calculate max width based on difficulty to prevent overflow
    const maxWidth = {
      beginner: 'max-w-[360px]',    // 9 cols * 40px
      intermediate: 'max-w-[560px]', // 16 cols * 35px
      expert: 'max-w-[840px]'       // 30 cols * 28px
    }[difficulty];

    return (
      <div className={`w-full ${maxWidth} mx-auto`}>
        <div 
          className="grid gap-px bg-gray-300 dark:bg-gray-600 p-1 rounded-md overflow-hidden w-full"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {board.map((row, i) =>
            row.map((cell, j) => renderCell(cell, i, j))
          )}
        </div>
      </div>
    );
  };
  
  // Render game over/win screen
  const renderGameOver = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-sm rounded-md">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center max-w-xs border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">
          {gameStatus === 'won' ? 'You Won! 🎉' : 'Game Over! 💣'}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {gameStatus === 'won'
            ? `Time: ${time}s`
            : 'You hit a mine!'
          }
        </p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={initGame}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-medium transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
  
  // Render welcome screen
  const renderWelcomeScreen = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-800/95 rounded-md">
      <div className="text-center p-6 max-w-xs">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertOctagon className="w-8 h-8 text-amber-500 dark:text-amber-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Minesweeper</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Left-click to reveal a cell, right-click to place a flag. Avoid the mines!
        </p>
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-2">Difficulty:</h4>
          {renderDifficultySelector()}
        </div>
        <button
          onClick={() => setGameStarted(true)}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-medium transition-colors shadow-sm"
        >
          Start Game
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 max-w-full overflow-hidden transition-colors duration-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Minesweeper</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            disabled={!gameStarted || gameStatus !== 'playing'}
            className={`px-3 py-1 text-sm rounded-md ${
              !gameStarted || gameStatus !== 'playing'
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
            }`}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={initGame}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md flex items-center transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            New
          </button>
        </div>
      </div>
      
      {renderDifficultySelector()}
      {renderGameInfo()}
      
      <div className="relative bg-gray-200 dark:bg-gray-700 p-1.5 rounded-md overflow-auto max-h-[70vh] transition-colors">
        {renderBoard()}
        
        {!gameStarted && renderWelcomeScreen()}
        {gameStatus !== 'playing' && gameStarted && renderGameOver()}
        {isPaused && gameStarted && gameStatus === 'playing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 dark:bg-black/50 backdrop-blur-sm rounded-md">
            <div className="bg-white/90 dark:bg-gray-800/90 px-6 py-3 rounded-lg font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
              Paused
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        <p>Left-click to reveal, Right-click to flag</p>
      </div>
    </div>
  );
}
