"use client";

import React from "react";

class FatalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { crashed: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Fatal app error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.crashed) {
      return (
        <div className="overlay">
          <div className="snackbar" style={{ whiteSpace: "pre-wrap", color: "red" }}>
            <p>Something went wrong. Please refresh the page.</p>
            <details style={{ maxHeight: 200, overflow: "auto" }}>
              <summary>Show error details</summary>
              <p>{this.state.error && this.state.error.toString()}</p>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
            <button onClick={() => window.location.reload()}>Refresh</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FatalErrorBoundary;
