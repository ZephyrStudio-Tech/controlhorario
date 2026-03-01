import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginEmail, loginDNI, getMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { Clock, Mail, Hash, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('email') // 'email' | 'dni'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dni, setDni] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      let tokenRes
      if (mode === 'email') {
        tokenRes = await loginEmail(email, password)
      } else {
        tokenRes = await loginDNI(dni)
      }
      const tokens = tokenRes.data
      // Guardamos el token antes de llamar a getMe para que el interceptor lo use
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      const meRes = await getMe()
      // login() actualiza el estado del contexto, no vuelve a guardar tokens
      login(tokens, meRes.data)
      const rol = meRes.data.rol
      if (rol === 'admin') navigate('/admin')
      else if (rol === 'rrhh') navigate('/hr')
      else navigate('/worker')
    } catch (err) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setError(err.response?.data?.detail?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1e3a6e 0%, var(--primary) 55%, var(--primary-light) 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Control Horario</h1>
          <p className="text-white/60 text-sm mt-2">Accede a tu cuenta</p>
        </div>

        <div style={{
          background: 'var(--surface-card)',
          borderRadius: '1.25rem',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.12)',
          padding: '2rem',
        }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface)', borderRadius: '12px', padding: '0.25rem', marginBottom: '1.75rem' }}>
            <button
              type="button"
              onClick={() => setMode('email')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '9px',
                fontSize: '0.875rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: mode === 'email' ? 'var(--surface-card)' : 'transparent',
                color: mode === 'email' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: mode === 'email' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setMode('dni')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '9px',
                fontSize: '0.875rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: mode === 'dni' ? 'var(--surface-card)' : 'transparent',
                color: mode === 'dni' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: mode === 'dni' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Hash className="w-4 h-4" />
              DNI rápido
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'email' ? (
              <>
                <div>
                  <label className="label">Correo electrónico</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="usuario@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="label">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="label text-center block text-base mb-3">Introduce tu DNI</label>
                <input
                  type="text"
                  className="input text-center text-2xl font-mono tracking-widest py-4 uppercase"
                  placeholder="00000000A"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.toUpperCase())}
                  maxLength={10}
                  required
                  autoComplete="off"
                  inputMode="text"
                />
                <p className="text-xs text-text-muted text-center mt-2">
                  Usa tu DNI como acceso rápido en dispositivos compartidos
                </p>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full btn-lg mt-2"
              disabled={loading}
              style={{ marginTop: '1.25rem', borderRadius: '10px', fontSize: '0.9375rem' }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
