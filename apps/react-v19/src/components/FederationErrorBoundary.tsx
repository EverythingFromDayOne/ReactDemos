import React from 'react';
import type { ErrorInfo, ReactNode } from 'react';

type FederationErrorBoundaryProps = {
  fallback: ReactNode;
  children: ReactNode;
};

type FederationErrorBoundaryState = {
  hasError: boolean;
};

export class FederationErrorBoundary extends React.Component<
  FederationErrorBoundaryProps,
  FederationErrorBoundaryState
> {
  state: FederationErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): FederationErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[federation] Remote render failed', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
