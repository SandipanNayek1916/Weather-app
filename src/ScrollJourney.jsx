import React, { useEffect, memo } from 'react';
import { motion, useTransform, useSpring, useMotionValue } from 'framer-motion';
import './ScrollJourney.css';

export default memo(function ScrollJourney({ scrollYProgress, weather, theme }) {
  // Smooth out the scroll progress slightly to avoid jank
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // 1. SKY GRADIENT (Day to Night transition)
  const skyBackground = useTransform(
    smoothProgress,
    [0, 0.4, 0.8, 1],
    [
      'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)', // Morning/Clear
      'linear-gradient(180deg, #4A90E2 0%, #D0E1F9 100%)', // Noon/Cloudy
      'linear-gradient(180deg, #FF7E5F 0%, #FEB47B 100%)', // Sunset
      'linear-gradient(180deg, #0B1021 0%, #1B2735 100%)'  // Night
    ]
  );

  // Temperature Influence: If it's very hot, shift the upper colors redder.
  // We apply this via an overlay mix-blend-mode.
  const temp = weather.current.temperature_2m;
  const isHot = temp > 30;
  const isCold = temp < 5;

  const tempOverlayOpacity = useTransform(smoothProgress, [0, 0.5, 1], [0.1, 0.3, 0]);
  const tempOverlayColor = isHot ? '#FF4500' : isCold ? '#00FFFF' : 'transparent';

  // 2. SUN & MOON PARALLAX
  // Sun sets as we scroll down
  const sunY = useTransform(smoothProgress, [0, 0.8], ['0vh', '100vh']);
  const sunOpacity = useTransform(smoothProgress, [0, 0.7, 0.85], [1, 1, 0]);
  const sunScale = useTransform(smoothProgress, [0, 0.8], [1, 1.5]);

  // Moon rises as we scroll down past sunset
  const moonY = useTransform(smoothProgress, [0.6, 1], ['100vh', '15vh']);
  const moonOpacity = useTransform(smoothProgress, [0.6, 0.8, 1], [0, 0.8, 1]);

  // 3. STARS
  const starsOpacity = useTransform(smoothProgress, [0.7, 1], [0, 1]);
  const starsY = useTransform(smoothProgress, [0.7, 1], ['-20vh', '0vh']);

  // 4. CLOUDS PARALLAX
  // Clouds move up faster than the background to create depth
  const cloud1Y = useTransform(smoothProgress, [0, 1], ['0vh', '-50vh']);
  const cloud2Y = useTransform(smoothProgress, [0, 1], ['20vh', '-80vh']);
  const cloudOpacity = useTransform(smoothProgress, [0, 0.5, 1], [0.8, 0.4, 0.1]);

  // 5. RAIN / STORM INTENSITY
  // Rain particles appear more intensely in the middle/lower sections if there's actual rain.
  const precip = weather.current.precipitation || 0;
  const hasRain = precip > 0 || weather.daily.precipitation_probability_max[0] > 20;
  
  // As you scroll deeper, you enter the "storm"
  const rainOpacity = useTransform(smoothProgress, [0.2, 0.5, 0.9], [0, hasRain ? 1 : 0.2, hasRain ? 0.8 : 0]);
  
  // Lightning flashes in the storm section (between 0.6 and 0.9)
  const lightningOpacity = useMotionValue(0);

  useEffect(() => {
    if (!hasRain) return;
    
    let isFlashing = false;
    // Check scroll value directly for side effects
    const unsubscribe = smoothProgress.on("change", (latest) => {
      if (latest > 0.6 && latest < 0.9 && !isFlashing) {
        if (Math.random() > 0.98) {
          isFlashing = true;
          lightningOpacity.set(1);
          setTimeout(() => lightningOpacity.set(0), 100);
          setTimeout(() => lightningOpacity.set(0.5), 150);
          setTimeout(() => {
            lightningOpacity.set(0);
            setTimeout(() => { isFlashing = false; }, 300); // cooldown
          }, 200);
        }
      }
    });
    return () => unsubscribe();
  }, [smoothProgress, hasRain, lightningOpacity]);

  // 6. FROST OVERLAY (Cold weather effect)
  const frostOpacity = useTransform(
    smoothProgress, 
    [0.5, 1], 
    [0, isCold ? 0.6 : 0]
  );

  return (
    <motion.div 
      className="scroll-journey-container" 
      style={{ background: skyBackground }}
    >
      {/* Temperature Tint */}
      <motion.div 
        className="temp-overlay" 
        style={{ 
          backgroundColor: tempOverlayColor, 
          opacity: tempOverlayOpacity,
          mixBlendMode: isHot ? 'overlay' : 'soft-light' 
        }} 
      />

      {/* Lightning Flash */}
      <motion.div 
        className="lightning-flash" 
        style={{ opacity: lightningOpacity }} 
      />

      {/* Stars Layer */}
      <motion.div className="stars-layer" style={{ opacity: starsOpacity, y: starsY }} />

      {/* Sun */}
      <motion.div className="sun-element" style={{ y: sunY, opacity: sunOpacity, scale: sunScale }}>
        <div className="sun-core"></div>
        <div className="sun-glow"></div>
      </motion.div>

      {/* Moon */}
      <motion.div className="moon-element" style={{ y: moonY, opacity: moonOpacity }}>
        <div className="moon-crater c1"></div>
        <div className="moon-crater c2"></div>
      </motion.div>

      {/* Clouds Layer (Parallax) */}
      <motion.div className="clouds-layer cloud-bg" style={{ y: cloud2Y, opacity: cloudOpacity }} />
      <motion.div className="clouds-layer cloud-fg" style={{ y: cloud1Y, opacity: cloudOpacity }} />

      {/* Rain System Overlay */}
      {hasRain && (
        <motion.div className="rain-system" style={{ opacity: rainOpacity }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div 
              key={i} 
              className="rain-drop" 
              style={{ 
                left: `${Math.random() * 100}%`, 
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                animationDelay: `${Math.random()}s`
              }} 
            />
          ))}
        </motion.div>
      )}

      {/* Frost Vignette */}
      {isCold && (
        <motion.div className="frost-overlay" style={{ opacity: frostOpacity }} />
      )}
    </motion.div>
  );
}
