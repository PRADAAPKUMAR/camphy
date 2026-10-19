import { useEffect, useState, useCallback, memo } from "react";
import { Timer as TimerIcon } from "lucide-react";

interface TimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
  isRunning: boolean;
}

const Timer = memo(({ durationMinutes, onTimeUp, isRunning }: TimerProps) => {
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
  const isLow = secondsLeft < 300;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 font-mono text-sm font-bold tabular-nums transition-colors ${
        isLow
          ? "border-destructive/30 bg-destructive/10 text-destructive animate-pulse"
          : "border-primary/20 bg-primary/5 text-primary"
      }`}
    >
      <TimerIcon className="h-4 w-4" />
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
});

Timer.displayName = "Timer";

export default Timer;