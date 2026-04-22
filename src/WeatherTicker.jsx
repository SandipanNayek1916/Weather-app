import { useRef, useEffect } from 'react';

/**
 * WeatherTicker — a seamless horizontally-scrolling marquee strip
 * showing live weather stats in the ROIHeads editorial style.
 */
export default function WeatherTicker({ items = [] }) {
  if (!items.length) return null;

  // Build the ticker string (doubled for seamless loop)
  const ticker = items
    .map(item => `${item.icon || '·'}  ${item.label}  ${item.value}`)
    .join('      ◈      ');

  return (
    <div className="weather-ticker-wrap" aria-hidden="true">
      <div className="weather-ticker-inner">
        <div className="weather-ticker-track">
          <span className="weather-ticker-text">{ticker}</span>
          <span className="weather-ticker-text" aria-hidden="true">{ticker}</span>
        </div>
      </div>
    </div>
  );
}
