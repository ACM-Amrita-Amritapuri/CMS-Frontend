import { Component, type ReactNode } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";

export class ApplicationErrorBoundary extends Component<
  { children: ReactNode; locationKey?: string },
  { failed: boolean }
> {
  state = { failed: false };

  componentDidUpdate(previousProps: { children: ReactNode; locationKey?: string }) {
    if (this.state.failed && previousProps.locationKey !== this.props.locationKey) {
      this.setState({ failed: false });
    }
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="mx-auto flex max-w-xl flex-col gap-4 p-8">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p>This page could not be displayed. Try again or reload the application.</p>
          <div className="flex gap-2">
            <Button onClick={() => this.setState({ failed: false })}>Try again</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

export function RootLayout() {
  const location = useLocation();
  return (
    <ApplicationErrorBoundary locationKey={location.key}>
      <ScrollRestoration />
      <Outlet />
    </ApplicationErrorBoundary>
  );
}
