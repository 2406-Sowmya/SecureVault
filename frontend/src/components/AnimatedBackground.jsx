import { motion } from 'framer-motion'

const nodes = [
  { className: 'left-[8%] top-[18%] h-2 w-2 bg-cyan-300/80', delay: 0 },
  { className: 'left-[24%] top-[72%] h-1.5 w-1.5 bg-emerald-300/80', delay: 0.8 },
  { className: 'left-[58%] top-[20%] h-2 w-2 bg-violet-300/80', delay: 1.2 },
  { className: 'left-[76%] top-[66%] h-1.5 w-1.5 bg-sky-300/80', delay: 0.4 },
  { className: 'left-[90%] top-[36%] h-2 w-2 bg-rose-300/70', delay: 1.6 },
]

export default function AnimatedBackground() {
  return (
    <div aria-hidden="true" className="cyber-background">
      <motion.div
        className="cyber-gradient"
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="cyber-mesh"
        animate={{ opacity: [0.35, 0.62, 0.35], scale: [1, 1.03, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="cyber-grid" />
      <div className="cyber-scanlines" />
      {nodes.map((node) => (
        <motion.span
          key={node.className}
          className={`cyber-node ${node.className}`}
          animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.4, 0.8] }}
          transition={{ duration: 3.8, delay: node.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
