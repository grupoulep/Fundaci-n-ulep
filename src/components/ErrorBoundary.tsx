import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    let message = 'Ocurrió un inconveniente al cargar esta sección.';
    if (error instanceof Error) {
      try {
        const parsed = JSON.parse(error.message) as { error?: string };
        if (parsed.error?.toLowerCase().includes('permission')) {
          message =
            'No cuentas con permisos suficientes para completar esta operación. Verifica tu sesión autorizada e inténtalo de nuevo.';
        } else if (parsed.error?.toLowerCase().includes('quota')) {
          message =
            'Se alcanzó temporalmente el límite diario de consultas. Por favor intenta nuevamente más tarde.';
        }
      } catch {
        if (error.message) {
          message = error.message;
        }
      }
    }
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    console.error('ErrorBoundary caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-center space-y-3"
        >
          <p className="text-sm font-semibold text-red-900">
            No se pudo completar la operación
          </p>
          <p className="text-xs text-red-800 max-w-md mx-auto leading-relaxed">
            {this.state.message}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="px-4 py-2 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
