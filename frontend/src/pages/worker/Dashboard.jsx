import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useCurrentSession } from '../../hooks/useCurrentSession'
import { useGeolocation } from '../../hooks/useGeolocation'
import { clockIn, clockOut, startPause, endPause, getMySessions } from '../../api/sessions'
import { LogIn, LogOut, Coffee, Play, AlertTriangle, Clock } from 'lucide-react'
import { format, differenceInSeconds, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

function ElapsedTimer({ since }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const base = differenceInSeconds(new Date(), new Date(since))
    setElapsed(base)
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [since])
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  return (
    <span className="font-mono text-4xl font-bold text-text-primary">
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  )
}

export default function WorkerDashboard() {
  const { user } = useAuth()
  const { session, loading, refresh } = useCurrentSession()
  const { request: requestGeo } = useGeolocation()
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(false)
  const [weekStats, setWeekStats] = useState(null)
  const [showPauseSelect, setShowPauseSelect] = useState(false)

  useEffect(() => {
    const now = new Date()
    const start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    getMySessions({ start_date: start, end_date: end }).then((res) => {
      const sessions = res.data
      const closed = sessions.filter((s) => s.estado === 'cerrada')
      const totalHoras = closed.reduce((acc, s) => acc + (s.horas_netas || 0), 0)
      setWeekStats({ dias: closed.length, horas: totalHoras.toFixed(1) })
    })
  }, [session])

  const doAction = async (action) => {
    setActionLoading(true)
    setError(null)
    try {
      const geo = await requestGeo()
      await action(geo)
      await refresh()
    } catch (err) {
      setError(err.response?.data?.detail?.message || 'Error al realizar la acción')
    } finally {
      setActionLoading(false)
    }
  }

  const handleClockIn = () => doAction((geo) => clockIn(geo))
  const handleClockOut = () => doAction((geo) => clockOut(geo))
  const handleStartPause = (tipo) => {
    setShowPauseSelect(false)
    doAction((geo) => startPause({ ...geo, tipo }))
  }
  const handleEndPause = () => doAction((geo) => endPause(geo))

  const stateLabel = !session
    ? 'Sin fichar'
    : session.estado === 'abierta'
      ? 'Trabajando'
      : session.estado === 'en_pausa'
        ? 'En pausa'
        : 'Jornada cerrada'

  const stateColor = !session
    ? 'bg-slate-100 text-slate-600'
    : session.estado === 'abierta'
      ? 'bg-green-100 text-green-700'
      : session.estado === 'en_pausa'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-slate-100 text-slate-600'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Hola, {user?.nombre}
        </h1>
        <p className="text-text-secondary text-sm mt-1.5">
          {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <span className={`badge text-sm px-3 py-1 rounded-full font-semibold ${stateColor}`}>
            {stateLabel}
          </span>
          {session?.fecha_entrada && (
            <span className="text-xs text-text-muted">
              Entrada: {format(new Date(session.fecha_entrada), 'HH:mm')}
            </span>
          )}
        </div>

        <div className="flex flex-col items-center py-6">
          {session?.estado === 'abierta' && (
            <ElapsedTimer since={session.fecha_entrada} />
          )}
          {session?.estado === 'en_pausa' && (
            <div className="text-center">
              <ElapsedTimer since={session.pauses?.find((p) => !p.fin_pausa)?.inicio_pausa || session.fecha_entrada} />
              <p className="text-sm text-amber-600 mt-2 font-medium">Tiempo en pausa</p>
            </div>
          )}
          {!session && (
            <div className="text-text-muted text-center py-4">
              <Clock className="w-14 h-14 mx-auto mb-4 opacity-20" />
              <p className="text-base">Ficha tu entrada para empezar</p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 mt-2">
          {!session && (
            <button
              className="btn-success btn-lg w-full text-lg"
              onClick={handleClockIn}
              disabled={actionLoading}
            >
              {actionLoading
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><LogIn className="w-5 h-5" /> Fichar Entrada</>
              }
            </button>
          )}

          {session?.estado === 'abierta' && (
            <>
              {showPauseSelect ? (
                <div className="grid grid-cols-3 gap-2">
                  {['descanso', 'comida', 'otro'].map((t) => (
                    <button
                      key={t}
                      className="btn-warning capitalize text-sm py-3"
                      onClick={() => handleStartPause(t)}
                      disabled={actionLoading}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  className="btn-warning btn-lg w-full text-lg"
                  onClick={() => setShowPauseSelect(true)}
                  disabled={actionLoading}
                >
                  <Coffee className="w-5 h-5" /> Iniciar Pausa
                </button>
              )}
              <button
                className="btn-danger btn-lg w-full text-lg"
                onClick={handleClockOut}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><LogOut className="w-5 h-5" /> Fichar Salida</>
                }
              </button>
            </>
          )}

          {session?.estado === 'en_pausa' && (
            <button
              className="btn-success btn-lg w-full text-lg"
              onClick={handleEndPause}
              disabled={actionLoading}
            >
              {actionLoading
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Play className="w-5 h-5" /> Finalizar Pausa</>
              }
            </button>
          )}
        </div>
      </div>

      {weekStats && (
        <div className="grid grid-cols-2 gap-5">
          <div className="card p-6">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-2 font-semibold">Esta semana</p>
            <p className="text-3xl font-bold text-text-primary leading-none mb-1.5">{weekStats.dias}</p>
            <p className="text-sm text-text-secondary">días fichados</p>
          </div>
          <div className="card p-6">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-2 font-semibold">Horas netas</p>
            <p className="text-3xl font-bold text-text-primary leading-none mb-1.5">{weekStats.horas}h</p>
            <p className="text-sm text-text-secondary">esta semana</p>
          </div>
        </div>
      )}
    </div>
  )
}
