export default function McqKeyboardHint() {
  return <p className="mcq-keyboard-hint text-xs leading-relaxed text-muted-foreground">
    <kbd>A</kbd>–<kbd>D</kbd> or <kbd>1</kbd>–<kbd>4</kbd> answer
    <span aria-hidden="true"> · </span><kbd>←</kbd> / <kbd>→</kbd> move
  </p>;
}
