import Navbar from './Navbar'

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar />
      <main className="min-h-screen" style={{ paddingTop: '3.5rem' }}>
        {/* Desplazar contenido 256px a la derecha en desktop para no solapar con sidebar */}
        <style>{`
          @media (min-width: 1024px) {
            .app-main { padding-top: 0 !important; padding-left: 256px; }
          }
        `}</style>
        <div className="app-main min-h-screen" style={{ paddingTop: '3.5rem' }}>
          <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '1.5rem 1rem' }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}