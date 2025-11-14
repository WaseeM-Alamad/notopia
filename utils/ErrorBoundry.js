"use client";

import React from "react";

class FatalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false };
  }

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Fatal app error:", error, errorInfo);
  }

  render() {
    if (this.state.crashed) {
      return (
        <div className="overlay">
          <div className="snackbar">
            <p>Something went wrong. Please refresh the page.</p>
            <button onClick={() => window.location.reload()}>Refresh</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FatalErrorBoundary;
