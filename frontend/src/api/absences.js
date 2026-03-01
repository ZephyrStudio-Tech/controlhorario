import api from './client'

export const createAbsence = (data) => api.post('/absences/', data)
export const requestAbsence = (data) => api.post('/absences/', data)
export const getMyAbsences = () => api.get('/absences/my')
export const getAllAbsences = (params = {}) => api.get('/absences/all', { params })
export const getPendingAbsences = () => api.get('/absences/all', { params: { estado: 'pendiente' } })
export const reviewAbsence = (id, data) => api.patch(`/absences/${id}/review`, data)
export const getPendingCount = () => api.get('/absences/pending/count')
