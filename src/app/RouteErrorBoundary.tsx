import { Component, type ErrorInfo, type ReactNode } from "react";

import { ErrorState } from "@/components/error-state";

export class RouteErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Route rendering failed", error, info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <ErrorState
        title="This page could not be rendered"
        message={this.state.error.message}
        className="mt-4"
      />
    );
  }
}
