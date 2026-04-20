import { useRef, useState } from 'react';
/* eslint-disable no-unused-vars */
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function MagneticElement({ children, strength = 30, className = "" }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const tx = useSpring(x, springConfig);
  const ty = useSpring(y, springConfig);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const pullX = ((clientX - centerX) / width) * strength;
    const pullY = ((clientY - centerY) / height) * strength;
    x.set(pullX);
    y.set(pullY);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{ scale: hovered ? 1.05 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ x: tx, y: ty, display: 'inline-block' }}
      className={`magnetic-element ${className}`}
    >
      {children}
    </motion.div>
  );
}
