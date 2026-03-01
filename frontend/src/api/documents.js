import api from './client'

export const uploadDocument = (formData) =>
  api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const getMyDocuments = () => api.get('/documents/my')
export const getAllDocuments = (params = {}) => api.get('/documents', { params })
export const getRecentDocuments = () => api.get('/documents', { params: { limit: 10, order: 'desc' } })
export const getUserDocuments = (userId) => api.get(`/documents/user/${userId}`)
export const downloadDocument = (id) =>
  api.get(`/documents/download/${id}`, { responseType: 'blob' })
export const deactivateDocument = (id) => api.delete(`/documents/${id}`)
