import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error(error); }
  render() {
    return this.state.failed
      ? <div className="grid min-h-screen place-items-center bg-cream p-6 text-center"><div><h1 className="font-display text-4xl uppercase">Something broke.</h1><a href="/app/chat" className="mt-6 inline-flex min-h-12 items-center border-2 border-ink bg-lime px-4 font-bold uppercase">Reload chat</a></div></div>
      : this.props.children;
  }
}
