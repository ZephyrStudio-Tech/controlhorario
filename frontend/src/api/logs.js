import api from './client'

export const getLogs = (params) => {
  return api.get('/logs', { params })
}