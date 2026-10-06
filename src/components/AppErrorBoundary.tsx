import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("PhysicsHQ render failed", error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
          <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-lg">
            <h1 className="text-xl font-extrabold">PhysicsHQ could not open</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Reload the page to reconnect to the latest version.
            </p>
            <button
              type="button"
              className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}