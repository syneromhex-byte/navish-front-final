import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface-0 p-6 text-center">
          <div className="glass-panel max-w-md rounded-2xl p-8 border border-border-subtle">
            <h2 className="mb-3 text-xl font-bold text-primary">Something went wrong</h2>
            <p className="mb-5 text-sm text-text-secondary">
              An unexpected application error occurred. Please refresh the page or contact support if the issue persists.
            </p>
            {this.state.error && (
              <pre className="mb-5 max-h-32 overflow-y-auto rounded-lg bg-surface-1 p-3 text-left font-mono text-[10px] text-primary/80">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-active py-2.5 text-sm font-semibold transition-colors duration-200"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
