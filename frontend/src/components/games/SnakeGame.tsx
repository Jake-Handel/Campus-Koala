'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

type Position = {
  x: number;
  y: number;
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

export default function SnakeGame({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [gameStarted, setGameStarted] = useState(false);
  const gameLoopRef = useRef<number>();
  const lastUpdateTime = useRef<number>(0);
  const lastDirectionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate random position for food
  const generateFood = useCallback((): Position => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    
    // Make sure food doesn't spawn on snake
    const isOnSnake = snake.some(segment => 
      segment.x === newFood.x && segment.y === newFood.y
    );
    
    if (isOnSnake) return generateFood();
    return newFood;
  }, [snake]);

  // Initialize game
  const initGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection('RIGHT');
    nextDirectionRef.current = 'RIGHT';
    setFood(generateFood());
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameStarted(true);
    setIsPaused(false);
  }, [generateFood]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) {
        setGameStarted(true);
        return;
      }

      if (e.key === ' ') {
        if (gameOver) {
          initGame();
        } else {
          setIsPaused(!isPaused);
        }
        return;
      }

      if (isPaused || gameOver) return;

      switch (e.key) {
        case 'ArrowUp':
          if (lastDirectionRef.current !== 'DOWN') nextDirectionRef.current = 'UP';
          break;
        case 'ArrowDown':
          if (lastDirectionRef.current !== 'UP') nextDirectionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
          if (lastDirectionRef.current !== 'RIGHT') nextDirectionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
          if (lastDirectionRef.current !== 'LEFT') nextDirectionRef.current = 'RIGHT';
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, isPaused, gameStarted, initGame]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || isPaused || gameOver) return;

    const gameLoop = (timestamp: number) => {
      // Throttle updates based on game speed
      if (timestamp - lastUpdateTime.current < speed) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      lastUpdateTime.current = timestamp;

      setDirection(nextDirectionRef.current);
      lastDirectionRef.current = nextDirectionRef.current;

      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        
        // Move head based on direction
        switch (nextDirectionRef.current) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
        }

        // Check for wall collision
        if (
          head.x < 0 ||
          head.x >= GRID_SIZE ||
          head.y < 0 ||
          head.y >= GRID_SIZE
        ) {
          setGameOver(true);
          onGameOver(score);
          return prevSnake;
        }

        // Check for self collision
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true);
          onGameOver(score);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];
        
        // Check for food collision
        if (head.x === food.x && head.y === food.y) {
          setFood(generateFood());
          setScore(prev => {
            const newScore = prev + 10;
            // Increase speed every 50 points
            if (newScore % 50 === 0 && speed > 50) {
              setSpeed(prevSpeed => Math.max(prevSpeed - 10, 50));
            }
            return newScore;
          });
          return newSnake; // Don't remove tail when eating food
        }

        // Remove tail if no food was eaten
        newSnake.pop();
        return newSnake;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [food, gameOver, gameStarted, generateFood, isPaused, onGameOver, score, speed]);

  // Draw game
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? '#10b981' : '#34d399';
      
      // Add rounded corners to snake segments
      const x = segment.x * CELL_SIZE;
      const y = segment.y * CELL_SIZE;
      const radius = 4;
      
      ctx.beginPath();
      ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, radius);
      ctx.fill();
      
      // Add eyes to the head
      if (isHead) {
        ctx.fillStyle = 'white';
        const eyeSize = 4;
        const eyeOffset = 5;
        
        // Left eye
        ctx.beginPath();
        if (direction === 'RIGHT') {
          ctx.arc(x + CELL_SIZE - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
        } else if (direction === 'LEFT') {
          ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
        } else if (direction === 'UP') {
          ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
        } else {
          ctx.arc(x + CELL_SIZE - eyeOffset, y + CELL_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
        }
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        if (direction === 'RIGHT') {
          ctx.arc(x + CELL_SIZE - eyeOffset, y + CELL_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
        } else if (direction === 'LEFT') {
          ctx.arc(x + eyeOffset, y + CELL_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
        } else if (direction === 'UP') {
          ctx.arc(x + CELL_SIZE - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
        } else {
          ctx.arc(x + eyeOffset, y + CELL_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    });

    // Draw food
    ctx.fillStyle = '#ef4444';
    const foodRadius = CELL_SIZE / 2;
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + foodRadius,
      food.y * CELL_SIZE + foodRadius,
      foodRadius * 0.8,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Add shine to food
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + foodRadius * 0.6,
      food.y * CELL_SIZE + foodRadius * 0.4,
      foodRadius * 0.3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }, [snake, food, direction]);

  // Touch controls for mobile
  const handleSwipe = (dir: Direction) => {
    if (!gameStarted) {
      setGameStarted(true);
      return;
    }
    
    if (gameOver) {
      initGame();
      return;
    }
    
    if (isPaused) {
      setIsPaused(false);
      return;
    }
    
    // Prevent 180-degree turns
    if (
      (dir === 'UP' && lastDirectionRef.current !== 'DOWN') ||
      (dir === 'DOWN' && lastDirectionRef.current !== 'UP') ||
      (dir === 'LEFT' && lastDirectionRef.current !== 'RIGHT') ||
      (dir === 'RIGHT' && lastDirectionRef.current !== 'LEFT')
    ) {
      nextDirectionRef.current = dir;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center w-full mb-4">
        <div className="bg-white/80 px-4 py-2 rounded-lg shadow-sm">
          <span className="font-semibold text-gray-700">Score: </span>
          <span className="text-emerald-600 font-bold">{score}</span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            disabled={gameOver}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              gameOver ? 'bg-gray-200 text-gray-400' : 'bg-white/80 hover:bg-white text-gray-700 shadow-sm'
            }`}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={initGame}
            className="px-4 py-2 bg-white/80 hover:bg-white text-gray-700 rounded-lg font-medium transition-colors shadow-sm flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </button>
        </div>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="bg-white rounded-xl border-2 border-gray-200 shadow-inner"
        />
        
        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
            <div className="bg-white p-6 rounded-xl text-center max-w-xs">
              <h3 className="text-xl font-bold mb-2">Snake Game</h3>
              <p className="text-gray-600 mb-4">
                Use arrow keys to move. Eat the red food to grow and earn points!
              </p>
              <button
                onClick={() => setGameStarted(true)}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                Start Game
              </button>
            </div>
          </div>
        )}
        
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
            <div className="bg-white p-6 rounded-xl text-center">
              <h3 className="text-xl font-bold mb-2">Game Over!</h3>
              <p className="text-gray-600 mb-4">Your score: {score}</p>
              <button
                onClick={initGame}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
        
        {isPaused && !gameOver && gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
            <div className="bg-white/90 px-6 py-3 rounded-lg font-medium text-gray-700">
              Paused
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Controls */}
      <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-xs md:hidden">
        <div></div>
        <button
          onClick={() => handleSwipe('UP')}
          className="bg-white/80 hover:bg-white p-4 rounded-lg shadow-md flex items-center justify-center"
        >
          <ArrowUp className="w-6 h-6 text-gray-700" />
        </button>
        <div></div>
        
        <button
          onClick={() => handleSwipe('LEFT')}
          className="bg-white/80 hover:bg-white p-4 rounded-lg shadow-md flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="bg-white/50 rounded-lg shadow-inner flex items-center justify-center">
          <span className="text-xs text-gray-500 font-medium">SWIPE</span>
        </div>
        <button
          onClick={() => handleSwipe('RIGHT')}
          className="bg-white/80 hover:bg-white p-4 rounded-lg shadow-md flex items-center justify-center"
        >
          <ArrowRight className="w-6 h-6 text-gray-700" />
        </button>
        
        <div></div>
        <button
          onClick={() => handleSwipe('DOWN')}
          className="bg-white/80 hover:bg-white p-4 rounded-lg shadow-md flex items-center justify-center"
        >
          <ArrowDown className="w-6 h-6 text-gray-700" />
        </button>
        <div></div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Press SPACE to {isPaused ? 'resume' : 'pause'}</p>
      </div>
    </div>
  );
}
