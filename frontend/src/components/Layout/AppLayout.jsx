import Navbar from './Navbar'

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar />
      {/* pt-14 en móvil para el topbar, lg:pl-64 en desktop para el sidebar */}
      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}