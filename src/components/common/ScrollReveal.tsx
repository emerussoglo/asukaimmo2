import React from 'react';
import { motion } from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  style = {},
}) => {
  const getInitial = () => {
    switch (direction) {
      case 'up':
        return { opacity: 0, y: 26 };
      case 'down':
        return { opacity: 0, y: -26 };
      case 'left':
        return { opacity: 0, x: -26 };
      case 'right':
        return { opacity: 0, x: 26 };
      default:
        return { opacity: 0, y: 26 };
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.16, 1, 0.3, 1], // fluid ease-in/ease-out
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};
