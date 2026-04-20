import { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import MagneticElement from './MagneticElement.jsx';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FloatingPill — an iOS-style floating action pill at the bottom of the viewport.
 * Shows current weather at a glance. Collapses on scroll down, expands on scroll up.
 */
export default function FloatingPill({
  temperature,
  condition,
  locationName,
  theme,
  isDay,
  onCityClick,
  cities = [],
  onSelectCity,
}) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const lastScrollRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // Show pill after initial load + small delay
    timerRef.current = setTimeout(() => setVisible(true), 3500);
    return () => clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const current = window.scrollY;
        // Show pill when scrolled past hero
        if (current > 400) {
          setVisible(true);
        }
        // Collapse if expanded and scrolling
        if (expanded && Math.abs(current - lastScrollRef.current) > 60) {
          setExpanded(false);
        }
        lastScrollRef.current = current;
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [expanded]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`floating-pill floating-pill-${theme} ${expanded ? 'floating-pill-expanded' : ''}`}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -100, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
        onClick={() => !expanded && setExpanded(true)}
        layout
      >
        <motion.div className="pill-summary">
          <div className="pill-icon-ring">
            <span className={`pill-dot pill-dot-${isDay ? 'day' : 'night'}`} />
          </div>
          <span className="pill-temp">{temperature}</span>
          <span className="pill-divider-line" />
          <span className="pill-condition">{condition}</span>
          <span className="pill-divider-line" />
          <div className="pill-location-badge">
            <span className="pill-location">{locationName}</span>
          </div>
        </motion.div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              className="pill-cities"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="pill-city-label">Quick switch</div>
              <div className="pill-city-row">
                {cities.slice(0, 5).map((city) => (
                  <MagneticElement key={`${city.name}-${city.latitude}`} strength={20}>
                    <button
                      className="pill-city-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCity(city);
                        setExpanded(false);
                      }}
                    >
                      {city.name}
                    </button>
                  </MagneticElement>
                ))}
              </div>
              <button
                className="pill-close"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(false);
                }}
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
