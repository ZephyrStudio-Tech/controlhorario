import { useState, useEffect } from 'react'
import { getAllUsers, createUser, updateUser, deactivateUser } from '../../api/users'
import Modal from '../../components/UI/Modal'
import Badge from '../../components/UI/Badge'
import { Plus, Edit2, UserX, AlertCircle } from 'lucide-react'

const EMPTY_FORM = {
  nombre: '',
  apellidos: '',
  email: '',
  dni: '',
  password: '',
  rol: 'worker',
  jornada_horas_diarias: '8',
  activo: true,
}

function UserRow({ user, onEdit, onDeactivate }) {
  return (
    <div className="card px-4 py-3 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-semibold text-primary text-sm">
        {user.nombre[0]}{user.apellidos[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-text-primary truncate">
          {user.nombre} {user.apellidos}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {user.email || user.dni}
          {' · '}
          {user.jornada_horas_diarias}h/día
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge value={user.rol} />
        {!user.activo && (
          <span className="text-xs text-red-500 font-medium">Inactivo</span>
        )}
        <button
          className="btn-ghost p-1.5"
          onClick={() => onEdit(user)}
          aria-label="Editar usuario"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        {user.activo && (
          <button
            className="btn-ghost p-1.5 text-red-500"
            onClick={() => onDeactivate(user)}
            aria-label="Desactivar usuario"
          >
            <UserX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [filterRol, setFilterRol] = useState('')
  const [filterActivo, setFilterActivo] = useState('true')
  const [confirmDeactivate, setConfirmDeactivate] = useState(null)

  const load = () => {
    setLoading(true)
    const params = {}
    if (filterRol) params.rol = filterRol
    if (filterActivo !== '') params.activo = filterActivo
    getAllUsers(params)
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingUser(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowModal(true)
  }

  const openEdit = (user) => {
    setEditingUser(user)
    setForm({
      nombre: user.nombre,
      apellidos: user.apellidos,
      email: user.email || '',
      dni: user.dni || '',
      password: '',
      rol: user.rol,
      jornada_horas_diarias: String(user.jornada_horas_diarias),
      activo: user.activo,
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        nombre: form.nombre,
        apellidos: form.apellidos,
        email: form.email || undefined,
        dni: form.dni,
        rol: form.rol,
        jornada_horas_diarias: parseFloat(form.jornada_horas_diarias),
      }
      if (form.password) payload.password = form.password
      if (editingUser) {
        await updateUser(editingUser.id, payload)
      } else {
        await createUser(payload)
      }
      setShowModal(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar el usuario.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return
    try {
      await deactivateUser(confirmDeactivate.id)
      setConfirmDeactivate(null)
      load()
    } catch {
      // silently fail
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Usuarios</h1>
        <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-32">
          <label className="label">Rol</label>
          <select className="input" value={filterRol} onChange={(e) => setFilterRol(e.target.value)}>
            <option value="">Todos</option>
            <option value="admin">Admin</option>
            <option value="rrhh">RRHH</option>
            <option value="worker">Trabajador</option>
          </select>
        </div>
        <div className="flex-1 min-w-32">
          <label className="label">Estado</label>
          <select className="input" value={filterActivo} onChange={(e) => setFilterActivo(e.target.value)}>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
            <option value="">Todos</option>
          </select>
        </div>
        <div className="self-end">
          <button className="btn-primary" onClick={load}>Buscar</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-text-muted">No hay usuarios</div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-text-muted">{users.length} usuarios</p>
          {users.map((u) => <UserRow key={u.id} user={u} onEdit={openEdit} onDeactivate={setConfirmDeactivate} />)}
        </div>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <Modal
          title={editingUser ? 'Editar usuario' : 'Nuevo usuario'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nombre</label>
                <input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div>
                <label className="label">Apellidos</label>
                <input className="input" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="label">DNI</label>
              <input className="input" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email (opcional)</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">{editingUser ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editingUser}
                autoComplete="new-password"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Rol</label>
                <select className="input" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                  <option value="worker">Trabajador</option>
                  <option value="rrhh">RRHH</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="label">Jornada (h/día)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  className="input"
                  value={form.jornada_horas_diarias}
                  onChange={(e) => setForm({ ...form, jornada_horas_diarias: e.target.value })}
                  required
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                {submitting
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : editingUser ? 'Guardar cambios' : 'Crear usuario'
                }
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm deactivate modal */}
      {confirmDeactivate && (
        <Modal title="Desactivar usuario" onClose={() => setConfirmDeactivate(null)}>
          <div className="space-y-4">
            <p className="text-text-secondary text-sm">
              ¿Seguro que quieres desactivar a{' '}
              <span className="font-semibold text-text-primary">
                {confirmDeactivate.nombre} {confirmDeactivate.apellidos}
              </span>
              ? El usuario no podrá acceder hasta que sea reactivado.
            </p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setConfirmDeactivate(null)}>Cancelar</button>
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl py-2.5 transition-colors" onClick={handleDeactivate}>
                Desactivar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
