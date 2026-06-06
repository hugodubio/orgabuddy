import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', background: '#1c1814', color: '#c8792a', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: 18 }}>Algo correu mal</h2>
          <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', color: '#f87171', background: '#2a1a1a', padding: 12, borderRadius: 8, overflow: 'auto', margin: 0 }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack?.split('\n').slice(0, 10).join('\n')}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '12px 20px', background: '#c8792a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, alignSelf: 'flex-start' }}
          >
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
