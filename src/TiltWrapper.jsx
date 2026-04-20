import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import './TiltWrapper.css';

const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2
};

/**
 * TiltWrapper - A reusable component that applies a subtle 3D tilt 
 * and scaling effect to its children on mouse hover.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Elements to wrap.
 * @param {number} [props.rotateAmplitude=8] - How much to tilt (subtle).
 * @param {number} [props.scaleOnHover=1.05] - Scaling factor on hover.
 * @param {string} [props.className=""] - Optional extra class.
 */
export default function TiltWrapper({ 
  children, 
  rotateAmplitude = 8, 
  scaleOnHover = 1.05,
  className = "" 
}) {
  const ref = useRef(null);

  // Motion values for tilt and scale
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);

  const rectRef = useRef(null);

  function handleMouse(e) {
    if (!ref.current) return;

    // Use cached rect computed onMouseEnter
    const rect = rectRef.current || ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);
  }

  function handleMouseEnter() {
    // Cache the rect once on enter to avoid layout thrashing during move
    if (ref.current) {
      rectRef.current = ref.current.getBoundingClientRect();
    }
    scale.set(scaleOnHover);
  }

  function handleMouseLeave() {
    rectRef.current = null;
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={`tilt-wrapper ${className}`}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: "preserve-3d"
      }}
    >
      {children}
    </motion.div>
  );
}
