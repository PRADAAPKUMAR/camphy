import { memo, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const RollingDigit = memo(({ digit, initialDigit }: { digit: string; initialDigit?: string }) => {
  const incoming = useRef<HTMLSpanElement>(null);
  const outgoing = useRef<HTMLSpanElement>(null);
  const previous = useRef(initialDigit ?? digit);

  useLayoutEffect(() => {
    const next = incoming.current;
    const old = outgoing.current;
    const before = previous.current;
    previous.current = digit;
    if (!next || !old || before === digit) return;
    old.textContent = before;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof next.animate !== "function") return;
    const direction = Number(digit) >= Number(before) ? 1 : -1;
    const options = { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };
    const enter = next.animate([{ transform: `translateY(${direction * 100}%)`, opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], options);
    const exit = old.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: `translateY(${-direction * 100}%)`, opacity: 0 }], options);
    return () => { enter.cancel(); exit.cancel(); };
  }, [digit]);

  return <span className="rolling-digit"><span ref={outgoing} className="rolling-digit-old" /><span ref={incoming} className="rolling-digit-new">{digit}</span></span>;
});
RollingDigit.displayName = "RollingDigit";

/** Only the painted digits roll; the accessible value and underlying clock stay current. */
const RollingNumber = ({ value, className, initialValue }: { value: string | number; className?: string; initialValue?: string | number }) => {
  const text = String(value);
  const initial = initialValue === undefined ? undefined : String(initialValue).padStart(text.length, "0");
  return <span className={cn("rolling-number tabular-nums", className)}><span className="sr-only">{text}</span><span aria-hidden="true" className="rolling-number-visual">{Array.from(text).map((char, index) => /\d/.test(char) ? <RollingDigit key={text.length - index} digit={char} initialDigit={initial?.[index]} /> : <span key={`separator-${text.length - index}`}>{char}</span>)}</span></span>;
};

export default RollingNumber;