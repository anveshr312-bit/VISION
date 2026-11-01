import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('VISION Critical Boundary Caught Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#111A19',
          color: '#EAECE9',
          padding: '40px 24px',
          fontFamily: 'JetBrains Mono, monospace',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            maxWidth: '800px',
            width: '100%',
            backgroundColor: '#1E2220',
            border: '1px solid rgba(217, 120, 101, 0.4)',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#D97865',
                display: 'inline-block',
              }} />
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#D97865', margin: 0 }}>
                VISION Runtime Diagnostic Intercept
              </h1>
            </div>
            <p style={{ color: '#949C96', fontSize: '13px', marginBottom: '20px' }}>
              An unexpected runtime error was caught during viewport rendering:
            </p>
            <div style={{
              backgroundColor: '#141715',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '16px',
              color: '#F2D5CF',
              fontSize: '13px',
              overflowX: 'auto',
              marginBottom: '20px',
            }}>
              <strong>{this.state.error?.name}:</strong> {this.state.error?.message}
            </div>
            {this.state.error?.stack && (
              <pre style={{
                backgroundColor: '#141715',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '16px',
                color: '#949C96',
                fontSize: '11px',
                overflowX: 'auto',
                maxHeight: '260px',
                marginBottom: '24px',
              }}>
                {this.state.error.stack}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#B8CE82',
                  color: '#181B19',
                  border: 'none',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Reload Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#2E3330',
                  color: '#EAECE9',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Clear Storage &amp; Reset
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
