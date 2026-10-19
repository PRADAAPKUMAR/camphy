import { memo, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const FlapCharacter = memo(({ character }: { character: string }) => {
  const previous = useRef(character);
  const from = previous.current;
  useLayoutEffect(() => { previous.current = character; }, [character]);
  if (character === ":" || character.trim() === "") return <span className={character === ":" ? "split-flap__separator" : "split-flap__space"}>{character}</span>;
  return <span className="split-flap__cell">
    <span className="split-flap__character">{character}</span>
    {from !== character && <span key={character} className="split-flap__change">
      <span className="split-flap__top"><span>{from}</span></span>
      <span className="split-flap__bottom"><span>{character}</span></span>
    </span>}
  </span>;
});
FlapCharacter.displayName = "FlapCharacter";

/** The value is supplied by the real clock; animation never drives timekeeping. */
export default function SplitFlapDisplay({ value, label = "Time", className }: { value: string; label?: string; className?: string }) {
  return <span className={cn("split-flap", className)} role="timer" aria-label={`${label}: ${value}`} aria-live="off">
    <span className="split-flap__digits" aria-hidden="true">
      {Array.from(value).map((character, index) => <FlapCharacter key={index} character={character} />)}
    </span>
  </span>;
}
