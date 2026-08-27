import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Adiona UI Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback flex flex-col items-center justify-center p-6 text-center" style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#ffffff' }}>
          <div className="error-card p-6 rounded-lg max-w-md" style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
            <div className="flex items-center justify-center mb-4 text-rose-500" style={{ marginBottom: '16px' }}>
              <AlertTriangle size={48} className="text-rose-500" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
              Something went wrong
            </h2>
            <p className="text-slate-400 mb-6 text-sm" style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '24px' }}>
              An unexpected error occurred while rendering the interactive map interface.
            </p>
            <button
              onClick={this.handleReload}
              className="btn btn-primary flex items-center justify-center gap-2 w-full"
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <RefreshCw size={16} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
