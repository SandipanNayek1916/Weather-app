import { useState, useEffect, useRef } from 'react';

/**
 * AnimatedNumber — smoothly animates between numeric values.
 * Uses requestAnimationFrame for buttery 60fps transitions.
 *
 * @param {number} value       - Target value to animate to
 * @param {number} duration    - Animation duration in seconds (default 1.2)
 * @param {string} suffix      - Optional suffix like "°C", "%", " hPa"
 * @param {string} prefix      - Optional prefix like "$"
 * @param {number} decimals    - Number of decimal places (default 0)
 * @param {string} className   - Optional CSS class
 */
export default function AnimatedNumber({
  value,
  duration = 1.2,
  suffix = '',
  prefix = '',
  decimals = 0,
  className = '',
}) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = Number(value);

    if (Number.isNaN(to)) {
      setDisplay(value);
      return;
    }

    if (from === to) return;

    const startTime = performance.now();
    const durationMs = duration * 1000;

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease-out cubic for a natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;

      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formatted =
    typeof display === 'number' && !Number.isNaN(display)
      ? display.toFixed(decimals)
      : display;

  return (
    <span className={`animated-number ${className}`}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
