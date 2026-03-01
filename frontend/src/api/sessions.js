import api from './client'

export const clockIn = (data) => api.post('/sessions/clock-in', data)
export const clockOut = (data) => api.post('/sessions/clock-out', data)
export const startPause = (data) => api.post('/sessions/pause/start', data)
export const endPause = (data) => api.post('/sessions/pause/end', data)
export const getCurrentSession = () => api.get('/sessions/current')
export const getMySessions = (params) => api.get('/sessions/my', { params })
export const getAllSessions = (params) => api.get('/sessions/all', { params })
export const updateSession = (id, data) => api.patch(`/sessions/${id}`, data)
export const generateReport = (params = {}) =>
  api.get('/sessions/report', { params, responseType: 'blob' })
