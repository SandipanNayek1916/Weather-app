import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import './ScrollInsightCard.css';

export default function ScrollInsightCard({ weather, location }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [displayedText, setDisplayedText] = useState('');
  
  const generateInsight = () => {
    const temp = weather.current.temperature_2m;
    const precip = weather.current.precipitation || 0;
    const wind = weather.current.wind_speed_10m;
    
    if (precip > 0.5) return `Notice: It is currently raining in ${location.name}. Stay dry and expect wet roads.`;
    if (wind > 30) return `Alert: High winds detected (${wind} km/h). Secure loose objects.`;
    if (temp > 30) return `Warning: High temperatures today. Stay hydrated and avoid direct sunlight.`;
    if (temp < 5) return `Warning: Freezing temperatures detected. Bundle up before heading out.`;
    
    return `Atmospheric conditions in ${location.name} are currently stable at ${temp}°C. A great day to be outside!`;
  };

  const fullText = generateInsight();

  useEffect(() => {
    if (isInView) {
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedText(fullText.slice(0, i));
        i++;
        if (i > fullText.length) {
          clearInterval(intervalId);
        }
      }, 30);
      return () => clearInterval(intervalId);
    }
  }, [isInView, fullText]);

  return (
    <motion.div 
      ref={ref}
      className="scroll-insight-card glass-card"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, type: "spring" }}
    >
      <div className="insight-header">
        <Sparkles size={18} color="#7cf2d6" />
        <span>AI Analysis</span>
      </div>
      <div className="insight-body">
        <p className="typewriter-text">{displayedText}<span className="cursor">|</span></p>
      </div>
    </motion.div>
  );
}
