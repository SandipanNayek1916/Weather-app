import { useMemo, useId } from 'react';

/**
 * SparkChart — tiny inline SVG sparkline chart.
 *
 * @param {number[]} data     - Array of numeric values
 * @param {string}   color    - Stroke/gradient color (default: var(--accent))
 * @param {number}   width    - SVG width (default 120)
 * @param {number}   height   - SVG height (default 36)
 * @param {boolean}  showDots - Show dots at data points
 * @param {string}   className
 */
export default function SparkChart({
  data = [],
  color = 'var(--accent)',
  width = 120,
  height = 36,
  showDots = false,
  className = '',
}) {
  const { polyline, area, dots } = useMemo(() => {
    if (!data.length) return { polyline: '', area: '', dots: [] };

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const pad = 4;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;

    const pts = data.map((v, i) => {
      const x = pad + (i / Math.max(data.length - 1, 1)) * innerW;
      const y = pad + innerH - ((v - min) / range) * innerH;
      return { x, y };
    });

    const polyline = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area =
      `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} ` +
      pts.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
      ` L ${pts[pts.length - 1].x.toFixed(1)},${height} L ${pts[0].x.toFixed(1)},${height} Z`;

    return { polyline, area, dots: pts };
  }, [data, width, height]);

  const baseId = useId();
  const gradientId = `spark-grad-${baseId.replace(/:/g, '')}`;

  if (!data.length) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`spark-chart ${className}`}
      width={width}
      height={height}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} className="spark-area" />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="spark-line"
      />
      {showDots &&
        dots.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="2.5"
            fill={color}
            className="spark-dot"
          />
        ))}
    </svg>
  );
}
