import * as React from 'react';
import { cn } from '@/lib/cn';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string | number;
  showLegend?: boolean;
  className?: string;
}

export function DonutChart({
  segments,
  size = 140,
  strokeWidth = 16,
  centerLabel,
  centerValue,
  showLegend = true,
  className,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center gap-6 justify-center',
        className
      )}
    >
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 transform"
        >
          {/* Base empty ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {total > 0 &&
            segments.map((seg, idx) => {
              const percent = seg.value / total;
              const dashLength = percent * circumference;
              const dashOffset = -accumulatedPercent * circumference;
              accumulatedPercent += percent;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={dashOffset}
                  fill="none"
                  className="transition-all duration-300"
                />
              );
            })}
        </svg>

        {/* Center label/value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <span className="text-lg font-bold font-display text-text-primary">
            {centerValue !== undefined ? centerValue : total}
          </span>
          {centerLabel && (
            <span className="text-[10px] uppercase tracking-wider text-text-secondary">
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      {showLegend && (
        <div className="flex flex-col gap-2 min-w-[140px]">
          {segments.map((seg, idx) => {
            const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
            return (
              <div
                key={idx}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-text-secondary">{seg.label}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-semibold text-text-primary">
                    {seg.value}
                  </span>
                  <span className="text-[10px] text-text-neutral">
                    ({pct}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

