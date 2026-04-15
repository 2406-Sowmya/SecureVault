/**
 * Background.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Animated cybersecurity particle-network background.
 *
 * Pure canvas implementation – no extra npm packages required.
 *
 * Features:
 *  • Floating particles with subtle drift
 *  • Connection lines between nearby particles (< 140 px)
 *  • Accent-coloured nodes that pulse gently
 *  • Dark theme matching SecureVault's palette
 *  • Respects reduced-motion preference
 *  • Cleans up correctly on unmount (no memory leaks)
 *
 * Usage (already wired in the updated App.jsx):
 *   import Background from './components/Background'
 *   <Background />   ← place once, outside router content
 */

import { useEffect, useRef } from 'react'

// ── Theming ───────────────────────────────────────────────────────────────────
const ACCENT   = '#e94560'   // vault-accent red
const TEAL     = '#00d4ff'   // secondary cyber teal
const DIM_NODE = 'rgba(255,255,255,0.18)'
const BG_COLOR = '#0a0a14'   // matches body background

// ── Config ────────────────────────────────────────────────────────────────────
const CONFIG = {
  particleCount : 80,
  maxSpeed      : 0.35,
  connectDist   : 140,
  minRadius     : 1.2,
  maxRadius     : 3.2,
  accentRatio   : 0.12,   // fraction of particles that glow in accent colour
  lineOpacity   : 0.18,
  fps           : 60,
}

// ── Particle factory ──────────────────────────────────────────────────────────
function makeParticle(w, h) {
  const isAccent = Math.random() < CONFIG.accentRatio
  const isTeal   = !isAccent && Math.random() < 0.08
  return {
    x      : Math.random() * w,
    y      : Math.random() * h,
    vx     : (Math.random() - 0.5) * CONFIG.maxSpeed * 2,
    vy     : (Math.random() - 0.5) * CONFIG.maxSpeed * 2,
    r      : CONFIG.minRadius + Math.random() * (CONFIG.maxRadius - CONFIG.minRadius),
    color  : isAccent ? ACCENT : isTeal ? TEAL : DIM_NODE,
    pulse  : isAccent || isTeal,
    phase  : Math.random() * Math.PI * 2,
    speed  : 0.015 + Math.random() * 0.02,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Background() {
  const canvasRef = useRef(null)

  useEffect(() => {
    // Respect system reduced-motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let width  = 0
    let height = 0
    let rafId  = null
    let particles = []

    // ── Resize handler ────────────────────────────────────────────────────────
    function resize() {
      width  = canvas.width  = window.innerWidth
      height = canvas.height = window.innerHeight
      // Regenerate on large resizes so density stays consistent
      particles = Array.from({ length: CONFIG.particleCount }, () => makeParticle(width, height))
    }

    // ── Draw loop ─────────────────────────────────────────────────────────────
    function draw() {
      ctx.clearRect(0, 0, width, height)

      const now = performance.now() * 0.001   // seconds

      // Update positions
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        // Wrap around edges
        if (p.x < -10)       p.x = width  + 10
        if (p.x > width + 10)  p.x = -10
        if (p.y < -10)       p.y = height + 10
        if (p.y > height + 10) p.y = -10
      }

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a  = particles[i]
          const b  = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < CONFIG.connectDist) {
            const alpha = CONFIG.lineOpacity * (1 - d / CONFIG.connectDist)
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            // Use accent colour if either endpoint is accent
            const isHot = a.color === ACCENT || b.color === ACCENT
              || a.color === TEAL || b.color === TEAL
            ctx.strokeStyle = isHot
              ? `rgba(233,69,96,${alpha * 0.7})`
              : `rgba(200,200,255,${alpha})`
            ctx.lineWidth   = 0.6
            ctx.stroke()
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        let radius = p.r
        if (p.pulse) {
          // Gentle breathing effect
          const pulse = 0.7 + 0.3 * Math.sin(now * p.speed * Math.PI * 2 + p.phase)
          radius = p.r * pulse

          // Soft glow halo
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 4)
          grd.addColorStop(0, p.color.replace(')', ',0.25)').replace('rgb', 'rgba'))
          grd.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.beginPath()
          ctx.arc(p.x, p.y, radius * 4, 0, Math.PI * 2)
          ctx.fillStyle = grd
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
      }

      rafId = requestAnimationFrame(draw)
    }

    // ── Init ──────────────────────────────────────────────────────────────────
    resize()
    window.addEventListener('resize', resize)
    draw()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position : 'fixed',
        inset    : 0,
        zIndex   : 0,
        pointerEvents : 'none',
        background: BG_COLOR,
      }}
    />
  )
}
