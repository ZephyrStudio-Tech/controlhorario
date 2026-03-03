import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/Layout/ProtectedRoute'
import AppLayout from './components/Layout/AppLayout'
import Login from './pages/Login'

// Worker pages
import WorkerDashboard from './pages/worker/Dashboard'
import WorkerRecords from './pages/worker/MyRecords'
import WorkerAbsences from './pages/worker/Absences'
import WorkerDocuments from './pages/worker/Documents'

// HR pages
import HRDashboard from './pages/hr/Dashboard'
import HRRecords from './pages/hr/Records'
import HRAbsences from './pages/hr/Absences'
import HRDocuments from './pages/hr/Documents'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminRecords from './pages/admin/Records'
import AdminAbsences from './pages/admin/Absences'
import AdminDocuments from './pages/admin/Documents'
import AdminReports from './pages/admin/Reports'
import AdminLogs from './pages/admin/Logs'

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.rol === 'admin') return <Navigate to="/admin" replace />
  if (user.rol === 'rrhh') return <Navigate to="/hr" replace />
  return <Navigate to="/worker" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Worker routes */}
          <Route
            path="/worker"
            element={
              <ProtectedRoute roles={['worker']}>
                <AppLayout><WorkerDashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/records"
            element={
              <ProtectedRoute roles={['worker']}>
                <AppLayout><WorkerRecords /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/absences"
            element={
              <ProtectedRoute roles={['worker']}>
                <AppLayout><WorkerAbsences /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/documents"
            element={
              <ProtectedRoute roles={['worker']}>
                <AppLayout><WorkerDocuments /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* HR routes */}
          <Route
            path="/hr"
            element={
              <ProtectedRoute roles={['rrhh']}>
                <AppLayout><HRDashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/records"
            element={
              <ProtectedRoute roles={['rrhh']}>
                <AppLayout><HRRecords /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/absences"
            element={
              <ProtectedRoute roles={['rrhh']}>
                <AppLayout><HRAbsences /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/documents"
            element={
              <ProtectedRoute roles={['rrhh']}>
                <AppLayout><HRDocuments /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout><AdminDashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout><AdminUsers /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/records"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout><AdminRecords /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/absences"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout><AdminAbsences /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/documents"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout><AdminDocuments /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout><AdminReports /></AppLayout>
              </ProtectedRoute>
            }
          />
          
          {/* RUTA CORREGIDA */}
          <Route 
            path="/admin/logs" 
            element={
              <ProtectedRoute roles={['admin']}>
                <AppLayout><AdminLogs /></AppLayout>
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App