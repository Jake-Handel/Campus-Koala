'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface TetrisProps {
  onGameEnd?: (score: number) => void;
}

// Game constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;
const DROP_TIME = 1000; // 1 second

type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

interface Tetromino {
  shape: number[][];
  color: string;
}

const TETROMINOES: Record<TetrominoType, Tetromino> = {
  I: { shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], color: 'cyan' },
  J: { shape: [[1,0,0], [1,1,1], [0,0,0]], color: 'blue' },
  L: { shape: [[0,0,1], [1,1,1], [0,0,0]], color: 'orange' },
  O: { shape: [[1,1], [1,1]], color: 'yellow' },
  S: { shape: [[0,1,1], [1,1,0], [0,0,0]], color: 'green' },
  T: { shape: [[0,1,0], [1,1,1], [0,0,0]], color: 'purple' },
  Z: { shape: [[1,1,0], [0,1,1], [0,0,0]], color: 'red' },
};

export default function Tetris({ onGameEnd }: TetrisProps) {
  const [board, setBoard] = useState<Array<Array<string | null>>>(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<{
    type: TetrominoType;
    position: { x: number; y: number };
    shape: number[][];
  } | null>(null);
  const [nextPiece, setNextPiece] = useState<TetrominoType>('I');
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // Get a random tetromino type
  const getRandomTetromino = (): TetrominoType => {
    const tetrominoes = Object.keys(TETROMINOES) as TetrominoType[];
    return tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
  };

  // Create a new piece
  const createNewPiece = useCallback((type: TetrominoType) => {
    const shape = TETROMINOES[type].shape;
    return {
      type,
      position: { 
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2), 
        y: 0 
      },
      shape
    };
  }, []);

  // Check if the current position is valid
  const isValidMove = useCallback((piece: typeof currentPiece, board: (string | null)[][]) => {
    if (!piece) return false;
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] !== 0) {
          const newX = piece.position.x + x;
          const newY = piece.position.y + y;
          
          if (
            newX < 0 || 
            newX >= BOARD_WIDTH || 
            newY >= BOARD_HEIGHT || 
            (newY >= 0 && board[newY][newX] !== null)
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }, []);

  // Rotate the current piece
  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const newPiece = {
      ...currentPiece,
      shape: currentPiece.shape[0].map((_, i) => 
        currentPiece.shape.map(row => row[i]).reverse()
      )
    };
    
    if (isValidMove(newPiece, board)) {
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, gameOver, isPaused, board, isValidMove]);

  // Move the current piece
  const movePiece = useCallback((direction: 'left' | 'right' | 'down') => {
    if (!currentPiece || gameOver || isPaused) return false;
    
    const newPiece = {
      ...currentPiece,
      position: { ...currentPiece.position }
    };
    
    switch (direction) {
      case 'left': newPiece.position.x--; break;
      case 'right': newPiece.position.x++; break;
      case 'down': newPiece.position.y++; break;
    }
    
    if (isValidMove(newPiece, board)) {
      setCurrentPiece(newPiece);
      return true;
    } else if (direction === 'down') {
      lockPiece();
      return false;
    }
    
    return false;
  }, [currentPiece, gameOver, isPaused, board, isValidMove]);

  // Lock the current piece in place
  const lockPiece = useCallback(() => {
    if (!currentPiece) return;
    
    const newBoard = board.map(row => [...row]);
    const { type, position, shape } = currentPiece;
    const color = TETROMINOES[type].color;
    
    // Place the piece on the board
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const boardY = position.y + y;
          const boardX = position.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = color;
          }
        }
      }
    }
    
    // Check for completed lines
    const completedLines: number[] = [];
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== null)) {
        completedLines.push(y);
      }
    }
    
    // Remove completed lines and add new ones at the top
    if (completedLines.length > 0) {
      completedLines.forEach(line => {
        newBoard.splice(line, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
      });
      
      // Update score - classic Tetris scoring system
      const linePoints = [0, 100, 300, 500, 800]; // Points for 0, 1, 2, 3, 4 lines
      const points = linePoints[Math.min(completedLines.length, 4)];
      setScore(prev => prev + points);
    }
    
    // Check for game over
    if (position.y <= 0) {
      setGameOver(true);
      if (onGameEnd) {
        onGameEnd(score);
      }
      return;
    }
    
    // Update board and get new piece
    setBoard(newBoard);
    setCurrentPiece(createNewPiece(nextPiece));
    setNextPiece(getRandomTetromino());
  }, [board, currentPiece, nextPiece, createNewPiece]);

  // Drop the current piece instantly
  const dropPiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    // Create a deep copy of the current piece
    let droppedPiece = {
      ...currentPiece,
      position: { ...currentPiece.position }
    };
    
    // Find the lowest valid position
    while (true) {
      const testPiece = {
        ...droppedPiece,
        position: {
          x: droppedPiece.position.x,
          y: droppedPiece.position.y + 1
        }
      };
      
      if (!isValidMove(testPiece, board)) {
        break;
      }
      
      droppedPiece = testPiece;
    }
    
    // If the piece moved, update it
    if (droppedPiece.position.y > currentPiece.position.y) {
      setCurrentPiece(droppedPiece);
      
      // Use a small timeout to ensure the state updates before locking
      setTimeout(() => {
        movePiece('down'); // This will trigger the lock
      }, 0);
    }
  }, [currentPiece, gameOver, isPaused, board, isValidMove, movePiece]);

  // Initialize a new game
  const startNewGame = useCallback(() => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)));
    setCurrentPiece(createNewPiece(getRandomTetromino()));
    setNextPiece(getRandomTetromino());
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setGameStarted(true);
  }, [createNewPiece]);

  // Toggle pause
  const togglePause = useCallback(() => {
    if (gameOver) return;
    setIsPaused(prev => !prev);
  }, [gameOver]);

  // Handle keyboard controls
  useEffect(() => {
    if (!gameStarted) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          movePiece('left');
          break;
        case 'ArrowRight':
          movePiece('right');
          break;
        case 'ArrowDown':
          movePiece('down');
          break;
        case 'ArrowUp':
          rotatePiece();
          break;
        case ' ':
          dropPiece();
          break;
        case 'p':
        case 'P':
          togglePause();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, isPaused, movePiece, rotatePiece, dropPiece, togglePause, gameStarted]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;
    
    const gameLoop = setInterval(() => {
      movePiece('down');
    }, DROP_TIME);
    
    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, isPaused, movePiece]);

  // Render the game board
  const renderBoard = () => {
    // Create a copy of the board to render
    const displayBoard = board.map(row => [...row]);
    
    // Add the current piece to the display board
    if (currentPiece) {
      const { type, position, shape } = currentPiece;
      const color = TETROMINOES[type].color;
      
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x] !== 0) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = color;
            }
          }
        }
      }
    }
    
    return (
      <div 
        className="grid bg-gray-900 border-2 border-gray-700 w-full"
        style={{
          gridTemplateColumns: `repeat(${BOARD_WIDTH}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${BOARD_HEIGHT}, minmax(0, 1fr))`,
          aspectRatio: `${BOARD_WIDTH}/${BOARD_HEIGHT}`,
          maxWidth: '100%',
          margin: '0 auto'
        }}
      >
        {displayBoard.flat().map((cell, index) => (
          <div
            key={index}
            className="border border-gray-800"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: cell || 'transparent',
            }}
          />
        ))}
      </div>
    );
  };

  // Render the next piece preview
  const renderNextPiece = () => {
    if (!nextPiece) return null;
    
    const { shape, color } = TETROMINOES[nextPiece];
    const previewSize = Math.max(shape.length, shape[0]?.length || 0);
    
    return (
      <div 
        className="border-2 border-gray-700 bg-gray-900 p-2"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${previewSize}, ${CELL_SIZE * 0.8}px)`,
          gridTemplateRows: `repeat(${previewSize}, ${CELL_SIZE * 0.8}px)`,
          gap: '1px',
        }}
      >
        {Array(previewSize * previewSize).fill(0).map((_, index) => {
          const x = index % previewSize;
          const y = Math.floor(index / previewSize);
          const cell = shape[y]?.[x] || 0;
          
          return (
            <div
              key={index}
              className="border border-gray-800"
              style={{
                width: CELL_SIZE * 0.8,
                height: CELL_SIZE * 0.8,
                backgroundColor: cell ? color : 'transparent',
              }}
            />
          );
        })}
      </div>
    );
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-900 text-white p-4 py-16">
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold mb-6 text-center">Tetris</h1>
          <button
            onClick={startNewGame}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-8"
          >
            Start Game
          </button>
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">How to Play</h2>
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="bg-gray-700 p-3 rounded">
                <p className="font-medium">← →</p>
                <p className="text-sm text-gray-300">Move left/right</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p className="font-medium">↑</p>
                <p className="text-sm text-gray-300">Rotate piece</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p className="font-medium">↓</p>
                <p className="text-sm text-gray-300">Soft drop</p>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p className="font-medium">Space</p>
                <p className="text-sm text-gray-300">Hard drop</p>
              </div>
              <div className="bg-gray-700 p-3 rounded col-span-2 text-center">
                <p className="font-medium">P</p>
                <p className="text-sm text-gray-300">Pause game</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white p-4 py-8">
      <div className="w-full max-w-3xl mx-auto py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Left Column - Game Board */}
          <div className="w-full max-w-[300px] mx-auto bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <div className="text-2xl font-bold">Score: {score}</div>
              <div className="flex gap-2">
                <button
                  onClick={togglePause}
                  className="text-white bg-blue-600 p-2 rounded hover:bg-blue-700 transition-colors"
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? <Play size={18} /> : <Pause size={18} />}
                </button>
                <button
                  onClick={startNewGame}
                  className="text-white bg-red-600 p-2 rounded hover:bg-red-700 transition-colors"
                  title="New Game"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>
            
            <div className="relative bg-gray-900 p-1 rounded overflow-hidden">
              {renderBoard()}
              
              {gameOver && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4">
                  <div className="text-2xl font-bold text-white mb-2">Game Over!</div>
                  <div className="text-xl text-blue-400 font-mono mb-4">{score}</div>
                  <button
                    onClick={startNewGame}
                    className="px-5 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Play Again
                  </button>
                </div>
              )}
              
              {isPaused && !gameOver && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div className="text-2xl font-bold text-white">Paused</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Game Info */}
          <div className="w-full max-w-[300px] mx-auto md:mx-0">
            <div className="bg-gray-800 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2 text-center">Next Piece</h3>
              <div className="flex justify-center bg-gray-900 p-3 rounded">
                {renderNextPiece()}
              </div>
            </div>
            
            <div className="bg-gray-800 p-3 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Controls</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-700 px-2 py-1 rounded w-8 text-center">← →</span>
                  <span>Move</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-700 px-2 py-1 rounded w-8 text-center">↑</span>
                  <span>Rotate</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-700 px-2 py-1 rounded w-8 text-center">↓</span>
                  <span>Soft drop</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-700 px-2 py-1 rounded text-xs w-14 text-center">Space</span>
                  <span>Hard drop</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-700 px-2 py-1 rounded w-8 text-center">P</span>
                  <span>Pause</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-700 px-2 py-1 rounded text-xs w-14 text-center">R</span>
                  <span>Restart</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}