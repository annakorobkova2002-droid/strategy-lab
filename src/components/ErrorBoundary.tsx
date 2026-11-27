import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page narrow">
        <h1>Something went wrong</h1>
        <p>Your progress is stored safely in this browser. Reload the page to continue.</p>
        <pre className="error-detail">{this.state.error.message}</pre>
        <button className="btn" onClick={() => location.reload()}>Reload</button>
      </div>
    );
  }
}
