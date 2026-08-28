import React from "react";
import { createRoot } from "react-dom/client";
import Dashboard from "./App";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return <main className="error-state"><span className="eyebrow">MONEYTRACE / RECOVERY</span><h1>Workspace unavailable</h1><p>The analyst surface encountered an unexpected rendering error. Your saved views remain in this browser.</p><button onClick={() => window.location.reload()}>Reload workspace</button></main>;
  }
}

createRoot(document.getElementById("root")).render(<AppErrorBoundary><Dashboard /></AppErrorBoundary>);
