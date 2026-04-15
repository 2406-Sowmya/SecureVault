import { motion } from 'framer-motion'

export default function Card({
  children,
  className = '',
  hover = true,
  delay = 0,
  as: Component = motion.div,
  ...props
}) {
  return (
    <Component
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay, ease: 'easeOut' }}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      className={`glass-card ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
