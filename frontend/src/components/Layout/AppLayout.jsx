import Navbar from './Navbar'

export default function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--sidebar-bg)' }}>
      <Navbar />
      {/* Contenido principal: esquina superior izquierda redondeada, fondo claro */}
      <main
        className="app-main"
        style={{
          flex: 1,
          marginLeft: '256px',
          marginTop: '0',
          backgroundColor: 'var(--surface)',
          borderTopLeftRadius: '1.75rem',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        {/* Topbar móvil */}
        <div className="lg:hidden" style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--surface-border)',
          padding: '0 1.25rem',
          height: '3.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Control Horario</span>
        </div>

        <div style={{ padding: '2.5rem 2.75rem', maxWidth: '1100px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
