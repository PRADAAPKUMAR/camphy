import { useEffect } from 'react';
import { installTiltedCards } from '../lib/tilted-card.js';
import './TiltedCard.css';

/** Apply the React Bits hover treatment to the site's existing navigation tiles. */
export default function TiltedCard({
  selector = '.grade-tile, .glass-card-hover',
  rotateAmplitude = 15,
  scaleOnHover = 1.1,
  glare = 0.5,
  shadow = 0.5,
}) {
  useEffect(() => installTiltedCards(document, selector, {
    rotateAmplitude, scaleOnHover, glare, shadow,
  }), [selector, rotateAmplitude, scaleOnHover, glare, shadow]);
  return null;
}

/** Optional decorative layer for new tiles; existing glass icons also receive depth. */
export function TiltedCardLayer({ depth = 30, className = '', style, children }) {
  return <span className={`tilted-card-layer ${className}`} style={{ '--tc-depth': depth, ...style }}>{children}</span>;
}
