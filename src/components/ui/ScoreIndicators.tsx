"use client";

import { BAND_STYLES, cn, scoreBand } from "@/lib/utils";
import type { ScoreBand } from "@/lib/types";

/** Circular score gauge used on detail pages and hero cards. */
export function ScoreRing({
  score,
  size = 84,
  label,
  stroke = 7,
}: {
  score: number;
  size?: number;
  label?: string;
  stroke?: number;
}) {
  const band = scoreBand(score);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-[var(--surface-3)]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn(BAND_STYLES[band].ring, "transition-[stroke-dashoffset] duration-1000 ease-out")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold tabular-nums leading-none tracking-[-0.02em]"
          style={{ fontSize: size * 0.3 }}
        >
          {score}
        </span>
        {label && (
          <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-subtle">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

/** Compact score chip used in tables and lists. */
export function ScorePill({ score, className }: { score: number; className?: string }) {
  const band = scoreBand(score);
  const s = BAND_STYLES[band];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[12.5px] font-semibold tabular-nums",
        s.bg,
        s.text,
        className,
      )}
      title={band}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {score}
    </span>
  );
}

export function BandBadge({ band, className }: { band: ScoreBand; className?: string }) {
  const s = BAND_STYLES[band];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium",
        s.bg,
        s.text,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {band}
    </span>
  );
}

/** Horizontal score bar with band colour, used in dense lists. */
export function ScoreBar({ score }: { score: number }) {
  const band = scoreBand(score);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${score}%`, background: BAND_STYLES[band].hex }}
        />
      </div>
      <span className="w-6 text-right text-[12px] font-semibold tabular-nums text-fg">{score}</span>
    </div>
  );
}
