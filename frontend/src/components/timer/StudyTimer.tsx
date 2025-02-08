import { useState, useEffect } from 'react';

export default function StudyTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [gameTime, setGameTime] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    try {
      const response = await fetch('http://localhost:5000/api/timer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          study_time: 25, // Minutes studied
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setGameTime(data.game_time_earned);
      }
    } catch (error) {
      console.error('Error updating timer:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <div className="text-6xl font-bold mb-8">{formatTime(timeLeft)}</div>
        
        <div className="space-x-4">
          <button
            onClick={toggleTimer}
            className={`px-6 py-2 rounded-lg ${
              isRunning
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            } text-white`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          
          <button
            onClick={resetTimer}
            className="px-6 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white"
          >
            Reset
          </button>
        </div>

        {gameTime > 0 && (
          <div className="mt-8 p-4 bg-indigo-100 rounded-lg">
            <p className="text-indigo-800">
              You've earned {gameTime.toFixed(1)} minutes of game time!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
