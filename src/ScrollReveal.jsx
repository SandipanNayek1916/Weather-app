import React from 'react';
import { motion } from 'framer-motion';

export default function ScrollReveal({ children, delay = 0, as = "div", className = "", id }) {
  const Component = motion[as] || motion.div;
  return (
    <Component
      id={id}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </Component>
  );
}
