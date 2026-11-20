import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      let parsedError = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed && parsed.error) {
          parsedError = `${parsed.error} (${parsed.operationType || 'operation'} on ${parsed.path || 'unknown path'})`;
        }
      } catch {
        // non-JSON error
      }

      return (
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-zinc-200 rounded-xl p-8">
            <div className="flex items-center gap-3 text-red-700 mb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-semibold text-zinc-900">
                Application Encountered an Error
              </h2>
            </div>
            <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
              CampusCart hit an unexpected runtime or data-access issue. Your cart items saved locally remain safe.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 mb-6 text-xs font-mono-tabular text-zinc-700 break-words">
              {parsedError}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-900 text-white text-sm font-medium rounded-lg hover:bg-violet-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
