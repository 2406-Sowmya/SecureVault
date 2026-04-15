import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Webcam from 'react-webcam'
import { ScanFace, CheckCircle, AlertCircle, Camera } from 'lucide-react'
import { authAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { withBrowserLocation } from '../utils/securityCapture'

export default function FaceScanPage() {
  const navigate             = useNavigate()
  const { sessionId, setLocation } = useAuth()
  const webcamRef            = useRef(null)
  const hasScannedRef        = useRef(false)

  const [status,   setStatus]   = useState('idle')   // idle | scanning | success | error | blocked
  const [message,  setMessage]  = useState('')
  const [camReady, setCamReady] = useState(false)
  const [countdown, setCount]   = useState(null)

  // Redirect if no session
  useEffect(() => {
    if (!sessionId) navigate('/login')
  }, [sessionId, navigate])

  const scan = useCallback(async () => {
    const screenshot = webcamRef.current?.getScreenshot({ width: 640, height: 480 })
    if (!screenshot) {
      hasScannedRef.current = false
      setMessage('Could not capture image. Check your camera.')
      return
    }

    setStatus('scanning')
    setMessage('Analysing your face…')

    try {
      const payload = await withBrowserLocation({ session_id: sessionId, face_image: screenshot })
      const res = await authAPI.faceVerify(payload)
      if (res.data?.location) setLocation(res.data.location)
      setStatus('success')
      setMessage('Face verified! OTP sent to your email.')
      // Countdown then navigate
      let c = 3
      setCount(c)
      const iv = setInterval(() => {
        c--
        setCount(c)
        if (c <= 0) { clearInterval(iv); navigate('/verify-otp') }
      }, 1000)
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.detail || 'Face not recognised. Security alert sent.')
      setTimeout(() => setStatus('blocked'), 1000)
    }
  }, [sessionId, navigate, setLocation])

  useEffect(() => {
    if (!camReady || !sessionId || status !== 'idle' || hasScannedRef.current) return
    hasScannedRef.current = true
    const timer = setTimeout(scan, 650)
    return () => clearTimeout(timer)
  }, [camReady, sessionId, scan, status])

  const statusColor = {
    idle:     'border-vault-accent',
    scanning: 'border-yellow-500',
    success:  'border-green-500',
    error:    'border-red-500',
    blocked:  'border-red-500',
  }[status]

  return (
    <div className="auth-page">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80
                        bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -32 }} transition={{ duration: 0.4 }}
        className="auth-card relative z-10 text-center"
      >
        {/* Header */}
        <motion.div
          animate={{ scale: status === 'scanning' ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: status === 'scanning' ? Infinity : 0, duration: 1.5 }}
          className="inline-flex p-4 rounded-2xl bg-vault-accent/10 mb-4 glow-accent"
        >
          <ScanFace className="w-10 h-10 text-vault-accent" />
        </motion.div>

        <h1 className="text-xl font-bold mb-1">Face Verification</h1>
        <p className="text-sm text-vault-muted mb-6">Step 2 of 3 — Look directly at your camera</p>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300
              ${i <= 1 ? 'w-8 bg-vault-accent' : 'w-4 bg-vault-border'}`} />
          ))}
        </div>

        {/* Webcam */}
        <div className={`relative mx-auto w-full max-w-xs rounded-2xl overflow-hidden
                        border-2 ${statusColor} transition-colors duration-500 mb-6 bg-black`}
          style={{ aspectRatio: '4/3' }}>
          <Webcam
            ref={webcamRef} audio={false} screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
            onUserMedia={() => setCamReady(true)}
            onUserMediaError={() => setMessage('Camera access denied.')}
            className="w-full h-full object-cover"
          />

          {/* Face oval guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-36 h-44 rounded-full border-2 border-dashed transition-colors duration-500
              ${statusColor} opacity-60`} />
          </div>

          {/* Scan line */}
          {status === 'scanning' && <div className="scan-line" />}

          {/* Success overlay */}
          {status === 'success' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}>
                <CheckCircle className="w-16 h-16 text-green-400" />
              </motion.div>
            </motion.div>
          )}

          {/* Error overlay */}
          {(status === 'error' || status === 'blocked') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-16 h-16 text-red-400" />
            </motion.div>
          )}
        </div>

        {/* Status message */}
        {message && (
          <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className={`text-sm mb-4 ${
              status === 'success' ? 'text-green-400' :
              status === 'error' || status === 'blocked' ? 'text-red-400' : 'text-vault-muted'
            }`}>
            {message}
            {countdown !== null && status === 'success' && ` Redirecting in ${countdown}s…`}
          </motion.p>
        )}

        {!camReady && status === 'idle' && (
          <p className="text-xs text-vault-muted mb-4">Waiting for camera permission…</p>
        )}

        {/* Scan button */}
        {false && status !== 'success' && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={scan}
            disabled={!camReady || status === 'scanning'}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {status === 'scanning' ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                Scanning…
              </>
            ) : (
              <><Camera className="w-4 h-4" /> Scan My Face</>
            )}
          </motion.button>
        )}

        {status === 'idle' && camReady && (
          <div className="btn-primary flex items-center justify-center gap-2 pointer-events-none">
            <Camera className="w-4 h-4" /> Auto capture starting
          </div>
        )}

        {status === 'scanning' && (
          <div className="btn-primary flex items-center justify-center gap-2 pointer-events-none">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            Scanning
          </div>
        )}

        {status === 'blocked' && (
          <button type="button" onClick={() => navigate('/login')}
            className="btn-danger flex items-center justify-center gap-2">
            Access denied
          </button>
        )}
      </motion.div>
    </div>
  )
}
