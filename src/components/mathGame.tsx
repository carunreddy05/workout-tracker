import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import useSound from 'use-sound';
import DateTimeAndWeather from './DateTimeAndWeather';
import Storybook from './Storybook';

const getRandomNumber = (level: number) => Math.floor(Math.random() * level) + 1;

const difficulties = {
  easy: 10,
  medium: 20,
  hard: 50,
};

export default function MathGame() {
  const [mode, setMode] = useState<'addition' | 'subtraction' | 'multiplication' | 'division' | 'storybook' | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [num1, setNum1] = useState<number | null>(null);
  const [num2, setNum2] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [lives, setLives] = useState(3);
  const [showWinScreen, setShowWinScreen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxQuestions = 10;

  const [playCorrect] = useSound('/assets/sounds/correct.mp3');
  const [playWrong] = useSound('/assets/sounds/wrong.mp3');
  const [playWin] = useSound('/assets/sounds/win.mp3');

  const [storyIndex, setStoryIndex] = useState(0);
  const storyPages = [
    {
      text: "The dog ran.",
      img: "/images/dog-run.png",
      audio: "/audio/the-dog-ran.mp3",
    },
    {
      text: "The dog sat.",
      img: "/images/dog-sit.png",
      audio: "/audio/the-dog-sat.mp3",
    },
    {
      text: "The dog got a hat.",
      img: "/images/dog-hat.png",
      audio: "/audio/the-dog-got-a-hat.mp3",
    },
    {
      text: "The dog had fun.",
      img: "/images/dog-fun.png",
      audio: "/audio/the-dog-had-fun.mp3",
    },
  ];

  useEffect(() => {
    if (mode === 'storybook') {
      const audio = new Audio(storyPages[storyIndex].audio);
      audio.play();
    }
  }, [storyIndex, mode]);

  useEffect(() => {
    if (mode && num1 !== null && num2 !== null && mode !== 'storybook') {
      timerRef.current && clearInterval(timerRef.current);
      setTimeLeft(30);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 1) {
            clearInterval(timerRef.current!);
            handleWrong();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [questionCount, mode]);

  const generateProblem = (selectedMode: 'addition' | 'subtraction' | 'multiplication' | 'division') => {
    const level = difficulties[difficulty];
    let a = getRandomNumber(level);
    let b = getRandomNumber(level);

    if (selectedMode === 'subtraction' && b > a) {
      [a, b] = [b, a];
    }

    if (selectedMode === 'division') {
      b = b === 0 ? 1 : b;
      a = b * getRandomNumber(level);
    }

    setMode(selectedMode);
    setNum1(a);
    setNum2(b);
    setUserAnswer('');
    setFeedback('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const startGame = (selectedMode: 'addition' | 'subtraction' | 'multiplication' | 'division') => {
    setCorrectCount(0);
    setIncorrectCount(0);
    setQuestionCount(0);
    setLives(3);
    setGameOver(false);
    setShowWinScreen(false);
    generateProblem(selectedMode);
  };

  const handleWrong = () => {
    playWrong();
    setIncorrectCount((prev) => prev + 1);
    setFeedback(`⏱️ Time's up or wrong answer.`);
    setLives((prev) => {
      const updated = prev - 1;
      if (updated <= 0) {
        setGameOver(true);
      }
      return updated;
    });
  };

  const checkAnswer = () => {
    if (num1 === null || num2 === null || !mode) return;
    let correctAnswer;

    switch (mode) {
      case 'addition':
        correctAnswer = num1 + num2;
        break;
      case 'subtraction':
        correctAnswer = num1 - num2;
        break;
      case 'multiplication':
        correctAnswer = num1 * num2;
        break;
      case 'division':
        correctAnswer = num1 / num2;
        break;
    }

    const isCorrect = mode === 'division'
      ? parseFloat(userAnswer) === parseFloat(correctAnswer.toFixed(2))
      : parseFloat(userAnswer) === correctAnswer;

    if (isCorrect) {
      playCorrect();
      confetti({ particleCount: 30, spread: 50 });
      setCorrectCount((prev) => prev + 1);
      setFeedback('✅ Correct!');
      const nextQuestion = questionCount + 1;
      setQuestionCount(nextQuestion);
      setTimeout(() => {
        if (nextQuestion >= maxQuestions) {
          playWin();
          confetti({ particleCount: 100, spread: 70 });
          setShowWinScreen(true);
        } else {
          generateProblem(mode);
        }
      }, 600);
    } else {
      handleWrong();
    }
  };

  const restart = () => {
    setMode(null);
    setNum1(null);
    setNum2(null);
    setUserAnswer('');
    setFeedback('');
    setCorrectCount(0);
    setIncorrectCount(0);
    setQuestionCount(0);
    setLives(3);
    setTimeLeft(30);
    setShowWinScreen(false);
    setGameOver(false);
    setStoryIndex(0);
  };

  const quitGame = () => {
    restart();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-4 sm:px-6 md:px-8">
      <main className="flex-grow w-full flex justify-center items-start pt-6">
        <div className="w-full max-w-md bg-black/40 backdrop-blur rounded-2xl shadow-2xl text-center">
          <div className="max-w-md mx-auto p-3 flex flex-col items-center text-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white transition-all duration-500">
            <DateTimeAndWeather />
            <h1 className="text-4xl font-extrabold mb-2 text-pink-400 drop-shadow tracking-wide animate-bounce">Number Ninjas 🎉</h1>
            <h2 className="text-2xl font-bold text-gray-300 mb-6">Train your brain!</h2>

            {!mode && !gameOver && !showWinScreen && (
              <>
                <div className="w-full mb-6">
                  <label htmlFor="difficulty" className="block text-lg font-semibold text-gray-300 mb-2 text-left">Choose Difficulty:</label>
                  <select
                    id="difficulty"
                    className="p-3 bg-gray-800 text-white border border-gray-600 rounded-xl w-full text-lg shadow focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition duration-200 appearance-none"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  >
                    <option value="easy">Easy (1–10)</option>
                    <option value="medium">Medium (1–20)</option>
                    <option value="hard">Hard (1–50)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <button onClick={() => startGame('addition')} className="bg-green-600 hover:bg-green-500 text-white px-5 py-3 rounded-lg shadow">➕ Addition</button>
                  <button onClick={() => startGame('subtraction')} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-lg shadow">➖ Subtraction</button>
                  <button onClick={() => startGame('multiplication')} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-lg shadow">✖️ Multiplication</button>
                  <button onClick={() => startGame('division')} className="bg-yellow-600 hover:bg-yellow-500 text-white px-5 py-3 rounded-lg shadow">➗ Division</button>
                  <button onClick={() => setMode('storybook')} className="bg-pink-600 hover:bg-pink-500 text-white px-5 py-3 rounded-lg shadow col-span-2">📖 English</button>
                </div>
              </>
            )}
          {mode === 'storybook' && <Storybook key="storybook" onQuit={restart} />}
            
          </div>
        </div>
      </main>
      <footer className="text-center text-sm text-gray-400 py-4">
        © {new Date().getFullYear()} Kindergarten Math Fun. All rights reserved.
      </footer>
    </div>
  );
}
