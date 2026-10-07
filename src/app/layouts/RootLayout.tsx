import { Component, type ReactNode, useEffect, useRef } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";

export class ApplicationErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  reset = () => {
    if (this.state.failed) this.setState({ failed: false });
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
  const boundary = useRef<ApplicationErrorBoundary>(null);
  return (
    <>
      <ResetErrorOnNavigation onNavigation={() => boundary.current?.reset()} />
      <ApplicationErrorBoundary ref={boundary}>
        <ScrollRestoration />
        <Outlet />
      </ApplicationErrorBoundary>
    </>
  );
}

function ResetErrorOnNavigation({ onNavigation }: { onNavigation: () => void }) {
  const { key } = useLocation();
  useEffect(onNavigation, [key, onNavigation]);
  return null;
}
