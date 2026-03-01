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
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      const meRes = await getMe()
      login(tokens, meRes.data)
      const rol = meRes.data.rol
      if (rol === 'admin') navigate('/admin')
      else if (rol === 'rrhh') navigate('/hr')
      else navigate('/worker')
    } catch (err) {
      setError(err.response?.data?.detail?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-primary-light flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-4">
            <Clock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Control Horario</h1>
          <p className="text-white/70 text-sm mt-1">Accede a tu cuenta</p>
        </div>

        <div className="card p-6">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-surface rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
                ${mode === 'email' ? 'bg-surface-card shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setMode('dni')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
                ${mode === 'dni' ? 'bg-surface-card shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <Hash className="w-4 h-4" />
              DNI rápido
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
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
