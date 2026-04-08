import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
          style={{ background: 'hsl(222 22% 5%)' }}
        >
          <AlertTriangle className="h-12 w-12 text-red-400" />
          <div>
            <p className="text-lg font-bold text-white">Algo salió mal</p>
            <p className="text-sm text-slate-400 mt-1">Intenta recargar la página</p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="mt-2 bg-primary hover:bg-primary/90"
          >
            Recargar
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
