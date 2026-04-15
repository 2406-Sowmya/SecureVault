import { AnimatePresence, motion } from 'framer-motion'

export default function VaultGrid({ children }) {
  return (
    <motion.div
      layout
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <AnimatePresence mode="popLayout">{children}</AnimatePresence>
    </motion.div>
  )
}
