import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#0a0a0f', color: '#e0e0e0',
          fontFamily: 'monospace', padding: 40, flexDirection: 'column', gap: 16
        }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#ff6b6b' }}>Application Error</h1>
          <pre style={{ fontSize: 12, maxWidth: '80vw', overflow: 'auto', background: '#1a1a2e', padding: 20, borderRadius: 8, border: '1px solid #333' }}>
            {this.state.error?.message || 'Unknown error'}
            {'\n\n'}
            {this.state.error?.stack || ''}
          </pre>
          <button onClick={() => window.location.reload()}
            style={{ padding: '8px 24px', background: '#4a6cf7', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
