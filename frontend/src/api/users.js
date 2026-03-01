import api from './client'

export const getAllUsers = (params = {}) => api.get('/users/', { params })
export const getSimpleUsers = () => api.get('/users/simple')
export const createUser = (data) => api.post('/users/', data)
export const updateUser = (id, data) => api.patch(`/users/${id}`, data)
export const deactivateUser = (id) => api.delete(`/users/${id}`)
export const getUsersStats = () => api.get('/sessions/today/summary')