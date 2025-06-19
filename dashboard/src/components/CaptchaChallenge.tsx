import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface CaptchaProps {
  onSuccess: () => void;
  onReset?: () => void;
}

const CaptchaChallenge = ({ onSuccess, onReset }: CaptchaProps) => {
  const [challenge, setChallenge] = useState<{
    question: string;
    options: string[];
    correct: number;
  } | null>(null);
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);

  const challenges = [
    {
      question: "Wähle den 🐝 (Biene)",
      options: ["🐛", "🐝", "🦋", "🐜"],
      correct: 1
    },
    {
      question: "Wähle das 🎮 (Gaming Controller)",
      options: ["🎮", "📱", "💻", "⌨️"],
      correct: 0
    },
    {
      question: "Wähle das 🏆 (Trophäe)",
      options: ["🎯", "🏆", "🎖️", "🥇"],
      correct: 1
    },
    {
      question: "Wähle den 🚀 (Rakete)",
      options: ["✈️", "🛸", "🚀", "🚁"],
      correct: 2
    },
    {
      question: "Wähle das 💜 (Lila Herz)",
      options: ["❤️", "💙", "💚", "💜"],
      correct: 3
    }
  ];

  useEffect(() => {
    generateNewChallenge();
  }, []);

  const generateNewChallenge = () => {
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    setChallenge(randomChallenge);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || !challenge) return;

    if (selectedAnswer === challenge.correct) {
      setIsCorrect(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } else {
      setIsCorrect(false);
      setAttempts(prev => prev + 1);
      
      if (attempts >= 2) {
        setTimeout(() => {
          generateNewChallenge();
          setAttempts(0);
        }, 1500);
      } else {
        setTimeout(() => {
          setSelectedAnswer(null);
          setIsCorrect(null);
        }, 1500);
      }
    }
  };

  const reset = () => {
    generateNewChallenge();
    setAttempts(0);
    onReset?.();
  };

  if (!challenge) return null;

  return (
    <div className="cyber-card p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-neon-purple mb-2">
          🛡️ Bot-Schutz Verifikation
        </h3>
        <p className="text-dark-text">{challenge.question}</p>
        {attempts > 0 && (
          <p className="text-red-400 text-sm mt-2">
            Falsch! Versuche übrig: {3 - attempts}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {challenge.options.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelectedAnswer(index)}
            disabled={isCorrect !== null}
            className={cn(
              "h-20 w-20 mx-auto text-4xl rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-neon",
              selectedAnswer === index
                ? isCorrect === true
                  ? "border-green-400 bg-green-400/20 shadow-green-glow"
                  : isCorrect === false
                  ? "border-red-400 bg-red-400/20 shadow-red-glow"
                  : "border-neon-purple bg-purple-primary/20 shadow-neon"
                : "border-purple-primary/50 bg-dark-surface hover:border-neon-purple"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={selectedAnswer === null || isCorrect !== null}
          variant="cyber"
          className="flex-1"
        >
          {isCorrect === true ? "✅ Korrekt!" : isCorrect === false ? "❌ Falsch" : "Bestätigen"}
        </Button>
        
        {attempts >= 2 && isCorrect === false && (
          <Button
            onClick={reset}
            variant="outline"
            className="text-neon-purple border-neon-purple"
          >
            🔄 Neu
          </Button>
        )}
      </div>

      {isCorrect === true && (
        <div className="mt-4 text-center">
          <div className="text-green-400 animate-bounce">
            🎉 Erfolgreich verifiziert!
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptchaChallenge; 