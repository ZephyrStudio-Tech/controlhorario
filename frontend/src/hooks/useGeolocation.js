import { useState, useCallback } from 'react'

export function useGeolocation() {
  const [coords, setCoords] = useState(null)
  const [denied, setDenied] = useState(false)

  const request = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setDenied(true)
        resolve({ lat: null, lon: null, geolocalizacion_denegada: true })
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const data = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            geolocalizacion_denegada: false,
          }
          setCoords(data)
          setDenied(false)
          resolve(data)
        },
        () => {
          setDenied(true)
          resolve({ lat: null, lon: null, geolocalizacion_denegada: true })
        },
        { timeout: 8000, maximumAge: 30000 },
      )
    })
  }, [])

  return { coords, denied, request }
}
