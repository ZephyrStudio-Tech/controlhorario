const ESTADO_MAP = {
  abierta:    { label: 'Trabajando',   cls: 'badge-green' },
  en_pausa:   { label: 'En pausa',     cls: 'badge-amber' },
  cerrada:    { label: 'Cerrada',      cls: 'badge-slate' },
  incompleta: { label: 'Incompleta',   cls: 'badge-red'   },
  pendiente:  { label: 'Pendiente',    cls: 'badge-amber' },
  aprobada:   { label: 'Aprobada',     cls: 'badge-green' },
  denegada:   { label: 'Denegada',     cls: 'badge-red'   },
  admin:      { label: 'Admin',        cls: 'badge-blue'  },
  rrhh:       { label: 'RRHH',         cls: 'badge-blue'  },
  worker:     { label: 'Trabajador',   cls: 'badge-slate' },
}

export default function Badge({ value }) {
  const map = ESTADO_MAP[value] || { label: value, cls: 'badge-slate' }
  return <span className={`badge ${map.cls}`}>{map.label}</span>
}