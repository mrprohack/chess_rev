import React from 'react';
import { getMotionPreset, getVerdictPlacement } from '../utils/reviewMotion';

const LANDING_PHASES = new Set(['landing', 'verdictReveal']);

export default function LandingEffect({
  classification,
  playedMove,
  isFlipped = false,
  phase = 'settled',
  mode = 'settled',
  token = 0,
}) {
  const preset = getMotionPreset(classification);
  if (!preset.classification || preset.landing === 'none') return null;
  if (mode !== 'animate' || !LANDING_PHASES.has(phase)) return null;

  const anchor = getVerdictPlacement(playedMove, isFlipped);
  if (!anchor) return null;

  return (
    <span
      key={`${token}:${preset.classification}:${playedMove || ''}`}
      className={`landing-effect landing-effect--${preset.landing}`}
      style={{ left: `${anchor.file * 12.5}%`, top: `${anchor.row * 12.5}%` }}
      aria-hidden="true"
    />
  );
}
