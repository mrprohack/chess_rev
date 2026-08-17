import React from 'react';
import { getMotionPreset, getVerdictPlacement } from '../utils/reviewMotion';

const VISIBLE_PHASES = new Set(['verdictReveal', 'panelSync', 'settled']);

export default function BoardVerdictBadge({
  classification,
  playedMove,
  isFlipped = false,
  phase = 'settled',
  mode = 'settled',
  token = 0,
}) {
  const preset = getMotionPreset(classification);
  if (!preset.classification || !preset.symbol) return null;
  if (mode === 'animate' && !VISIBLE_PHASES.has(phase)) return null;

  const anchor = getVerdictPlacement(playedMove, isFlipped);
  const className = [
    'board-verdict',
    `board-verdict--${preset.tone}`,
    `verdict-${preset.motion}`,
    anchor ? `board-verdict--${anchor.placement}` : 'board-verdict--fallback',
  ].join(' ');

  const style = anchor
    ? { left: `${anchor.leftPct}%`, top: `${anchor.topPct}%` }
    : undefined;

  return (
    <div
      key={`${token}:${preset.classification}:${playedMove || 'fallback'}`}
      className={className}
      style={style}
      data-placement={anchor?.placement || 'fallback'}
      data-verdict={preset.classification}
      aria-hidden="true"
    >
      <span className="board-verdict__symbol">{preset.symbol}</span>
    </div>
  );
}
