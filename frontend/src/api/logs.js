import api from './config'

export const getLogs = (params) => {
  return api.get('/logs', { params })
}