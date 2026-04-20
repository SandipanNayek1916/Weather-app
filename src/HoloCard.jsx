import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import './HoloCard.css';

export default function HoloCard({ children, className = '' }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({
    rotateX: 0,
    rotateY: 0,
    mx: 50,
    my: 50,
    opacity: 0
  });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    
    // Tilt limits
    const rx = ((y / height) * -20) + 10;
    const ry = ((x / width) * 20) - 10;
    
    setStyle({
      rotateX: rx,
      rotateY: ry,
      mx: (x / width) * 100,
      my: (y / height) * 100,
      opacity: 1
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      rotateX: 0,
      rotateY: 0,
      mx: 50,
      my: 50,
      opacity: 0
    });
  };

  return (
    <motion.article
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ 
        rotateX: style.rotateX, 
        rotateY: style.rotateY 
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`holo-card ${className}`}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000
      }}
    >
      <div 
        className="holo-glare" 
        style={{
          background: `radial-gradient(circle at ${style.mx}% ${style.my}%, rgba(255,255,255,0.2) 0%, transparent 40%)`,
          opacity: style.opacity
        }}
      />
      <div 
        className="holo-foil"
        style={{
          backgroundPosition: `${style.mx}% ${style.my}%`,
          opacity: style.opacity
        }}
      />
      <div className="holo-content">
        {children}
      </div>
    </motion.article>
  );
}
