import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Shield,
  User,
} from 'lucide-react'
import { authAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { primeBrowserLocation, withBrowserLocation } from '../utils/securityCapture'
import PageTransition from '../components/PageTransition'

const MAX_ATTEMPTS = 3

export default function LoginPage() {
  const navigate = useNavigate()
  const { setSessionId, setLocation } = useAuth()

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS)
  const [isLocked, setIsLocked] = useState(false)
  const [lockCountdown, setLockCountdown] = useState(0)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const countdownRef = useRef(null)

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }, [])

  const stopWebcam = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.onloadeddata = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const waitForVideoReady = useCallback(() => new Promise((resolve) => {
    const video = videoRef.current
    if (!video) {
      resolve(false)
      return
    }

    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      resolve(true)
      return
    }

    const timeoutId = window.setTimeout(() => {
      video.removeEventListener('loadeddata', handleLoadedData)
      resolve(false)
    }, 1500)

    const handleLoadedData = () => {
      window.clearTimeout(timeoutId)
      resolve(true)
    }

    video.addEventListener('loadeddata', handleLoadedData, { once: true })
  }), [])

  const startWebcam = useCallback(async () => {
    if (streamRef.current) {
      return waitForVideoReady()
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user',
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }

      console.log('Camera started')
      return waitForVideoReady()
    } catch {
      stopWebcam()
      return false
    }
  }, [stopWebcam, waitForVideoReady])

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    if (!video || !streamRef.current || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return null
    }

    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 320
      canvas.height = video.videoHeight || 240
      const context = canvas.getContext('2d')

      if (!context) {
        return null
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/jpeg', 0.85)
    } catch {
      return null
    }
  }, [])

  const captureIntruderEvidence = useCallback(async () => {
    const ready = await startWebcam()
    if (!ready) {
      stopWebcam()
      return null
    }

    try {
      return captureFrame()
    } finally {
      stopWebcam()
    }
  }, [captureFrame, startWebcam, stopWebcam])

  useEffect(() => {
    primeBrowserLocation()

    return () => {
      stopWebcam()
      clearCountdown()
    }
  }, [clearCountdown, stopWebcam])

  const startCountdown = useCallback((seconds) => {
    clearCountdown()
    setLockCountdown(seconds)
    setIsLocked(true)

    countdownRef.current = window.setInterval(() => {
      setLockCountdown((current) => {
        if (current <= 1) {
          clearCountdown()
          setIsLocked(false)
          setAttemptsLeft(MAX_ATTEMPTS)
          setError('')
          return 0
        }

        return current - 1
      })
    }, 1000)
  }, [clearCountdown])

  const onChange = (event) => {
    const { name, value } = event.target
    const usernameChanged = name === 'username' && form.username !== value

    setForm((current) => ({ ...current, [name]: value }))
    setError('')

    if (usernameChanged) {
      clearCountdown()
      setAttemptsLeft(MAX_ATTEMPTS)
      setIsLocked(false)
      setLockCountdown(0)
      stopWebcam()
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isLocked) return

    setError('')
    setLoading(true)

    try {
      const payload = await withBrowserLocation({ ...form })
      const res = await authAPI.login(payload)

      clearCountdown()
      setAttemptsLeft(MAX_ATTEMPTS)
      setIsLocked(false)
      setLockCountdown(0)
      setSessionId(res.data.session_id)
      setLocation(res.data.location || null)
      navigate('/face')
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail
      const detailMessage = typeof detail === 'string'
        ? detail
        : detail?.message || 'Login failed. Please try again.'

      if (status === 429) {
        const lockedSeconds = typeof detail === 'object' && detail?.locked_seconds
          ? detail.locked_seconds
          : Number.parseInt(detailMessage.match(/(\d+)\s*second/)?.[1] || '30', 10)

        setAttemptsLeft(0)
        setError(detailMessage)
        startCountdown(lockedSeconds)

        if (typeof detail === 'object' && detail?.capture_required) {
          console.log('Intruder detected')
          const intruderImage = await captureIntruderEvidence()

          if (intruderImage) {
            try {
              const intruderPayload = await withBrowserLocation({
                username: form.username,
                intruder_image: intruderImage,
              })
              await authAPI.reportIntruder(intruderPayload)
            } catch (captureError) {
              console.error('Intruder evidence upload failed', captureError)
            }
          }
        }
      } else {
        const left = Number.parseInt(detailMessage.match(/(\d+)\s*attempt/)?.[1] || `${Math.max(0, attemptsLeft - 1)}`, 10)
        setAttemptsLeft(Math.max(0, left))
        setError(detailMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const attemptBarColor = attemptsLeft === 3
    ? 'bg-green-500'
    : attemptsLeft === 2
      ? 'bg-yellow-500'
      : 'bg-red-500'

  return (
    <div className="auth-page">
      <video ref={videoRef} muted playsInline className="sr-capture-video" />

      <PageTransition className="auth-card relative z-10">
        <div className="mb-8 flex flex-col items-center">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
            className="mb-4 rounded-2xl bg-vault-accent/10 p-4 glow-accent"
          >
            <Shield className="h-10 w-10 text-vault-accent" />
          </motion.div>
          <h1 className="text-2xl font-semibold gradient-text">SecureVault</h1>
          <p className="mt-1 text-sm text-vault-muted">Multi-Factor Authentication</p>
        </div>

        <div className="mb-7 flex items-center gap-2">
          {['Password', 'Face', 'OTP'].map((step, index) => (
            <div key={step} className="flex flex-1 items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${index === 0 ? 'bg-vault-accent text-white' : 'bg-vault-border text-vault-muted'}`}>
                {index + 1}
              </div>
              <span className={`text-xs ${index === 0 ? 'text-vault-accent' : 'text-vault-muted'}`}>{step}</span>
              {index < 2 && <div className="h-px flex-1 bg-vault-border" />}
            </div>
          ))}
        </div>

        <AnimatePresence>
          {isLocked && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-400"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 animate-pulse" />
              <div className="text-sm">
                <div className="font-semibold">Account Locked</div>
                <div className="mt-0.5 text-xs opacity-80">
                  Try again in <span className="font-semibold text-red-300">{lockCountdown}s</span> - Security alert sent to registered email
                </div>
              </div>
              <div className="ml-auto flex h-10 w-10 items-center justify-center">
                <Clock className="h-5 w-5 text-red-400 spin-slow" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="vault-label">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vault-muted" />
              <input
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder="Enter your username"
                className="vault-input pl-10"
                required
                autoFocus
                disabled={isLocked}
              />
            </div>
          </div>

          <div>
            <label className="vault-label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vault-muted" />
              <input
                name="password"
                value={form.password}
                onChange={onChange}
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                className="vault-input pl-10 pr-10"
                required
                disabled={isLocked}
              />
              <button
                type="button"
                onClick={() => setShowPw((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-muted hover:text-vault-text"
                disabled={isLocked}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {attemptsLeft < MAX_ATTEMPTS && !isLocked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-vault-muted">Login attempts</span>
                  <span className={attemptsLeft === 1 ? 'font-semibold text-red-400' : 'text-yellow-400'}>
                    {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-vault-border">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: `${(attemptsLeft / MAX_ATTEMPTS) * 100}%` }}
                    transition={{ duration: 0.4 }}
                    className={`h-full rounded-full ${attemptBarColor}`}
                  />
                </div>
                {attemptsLeft === 1 && (
                  <p className="mt-1.5 text-xs text-red-400">
                    Last attempt. Security capture activates only if this attempt fails.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && !isLocked && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: isLocked ? 1 : 0.97 }}
            type="submit"
            disabled={loading || isLocked}
            className={`btn-primary mt-2 flex items-center justify-center gap-2 ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
              />
            ) : isLocked ? (
              <>
                <Clock className="h-4 w-4" />
                <span>Locked ({lockCountdown}s)</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <Link to="/forgot-password" className="text-vault-muted transition-colors hover:text-vault-accent">
            Forgot password?
          </Link>
          <span className="text-vault-muted">
            No account?{' '}
            <Link to="/register" className="font-medium text-vault-accent hover:underline">
              Create one
            </Link>
          </span>
        </div>
      </PageTransition>
    </div>
  )
}
