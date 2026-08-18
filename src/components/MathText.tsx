import { memo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Renders text that may contain LaTeX math:
 *  - $$ ... $$ for display math (fractions, big powers)
 *  - $ ... $  for inline math (v^2, F_{net}, \frac{1}{2}mv^2)
 * Blank lines create paragraphs.
 */
const renderSegment = (src: string, display: boolean) => {
  try {
    return katex.renderToString(src, {
      displayMode: display,
      throwOnError: false,
      strict: false,
      output: "html",
    });
  } catch {
    return src;
  }
};

const MathText = memo(({ text, className = "" }: { text: string; className?: string }) => {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g).filter(Boolean);

  return (
    <div
      className={`space-y-2 text-sm leading-relaxed break-words [overflow-wrap:anywhere] [&_.katex]:text-[1.02em] [&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1 ${className}`}
    >
      <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
        {parts.map((part, i) => {
          if (part.startsWith("$$") && part.endsWith("$$")) {
            return (
              <span
                key={i}
                className="my-2 block w-full overflow-x-auto overflow-y-hidden py-1 text-center"
                dangerouslySetInnerHTML={{ __html: renderSegment(part.slice(2, -2), true) }}
              />
            );
          }
          if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
            return (
              <span
                key={i}
                className="inline-block align-middle"
                dangerouslySetInnerHTML={{ __html: renderSegment(part.slice(1, -1), false) }}
              />
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    </div>
  );
});

MathText.displayName = "MathText";

export default MathText;
