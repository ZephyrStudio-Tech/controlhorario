import api from './client'

export const loginEmail = (email, password) =>
  api.post('/auth/login/email', { email, password })

export const loginDNI = (dni) =>
  api.post('/auth/login/dni', { dni })

export const getMe = () => api.get('/auth/me')
