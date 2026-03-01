import { useState, useEffect, useCallback } from 'react'
import { getCurrentSession } from '../api/sessions'

export function useCurrentSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCurrentSession()
      setSession(res.data)
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { session, loading, error, refresh, setSession }
}
