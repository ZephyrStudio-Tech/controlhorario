export default function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      backgroundColor: 'rgba(0,0,0,0.45)',
    }}>
      <div style={{
        backgroundColor: 'var(--surface-card)',
        borderRadius: '1rem',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: '28rem',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--surface-border)',
        }}>
          <h2 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
              fontSize: '1rem', padding: '0.25rem 0.5rem',
              borderRadius: '6px', lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ✕
          </button>
        </div>
        {/* Content */}
        <div style={{ padding: '1.25rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}