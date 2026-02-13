import { useEffect, useState, useCallback } from "react";
import { Clock } from "lucide-react";

interface TimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
  isRunning: boolean;
}

const Timer = ({ durationMinutes, onTimeUp, isRunning }: TimerProps) => {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    if (!isRunning) return;
    if (secondsLeft <= 0) {
      onTimeUp();
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, onTimeUp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isLow = secondsLeft < 300; // < 5 min

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-bold ${
        isLow
          ? "bg-destructive/10 text-destructive animate-pulse"
          : "bg-primary/10 text-primary"
      }`}
    >
      <Clock className="h-5 w-5" />
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
};

export default Timer;
