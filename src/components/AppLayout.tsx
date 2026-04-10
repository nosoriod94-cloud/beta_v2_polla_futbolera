import { Component, type ReactNode } from 'react'
import BottomNav from './BottomNav'

// ErrorBoundary local para BottomNav: si la barra falla (ej. notificaciones)
// no tumba la página entera, solo muestra una barra vacía.
class NavErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) {
      return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border/50 bg-background/90" />
      )
    }
    return this.props.children
  }
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-lg mx-auto pb-20">
        {children}
      </main>
      <NavErrorBoundary>
        <BottomNav />
      </NavErrorBoundary>
    </div>
  )
}
