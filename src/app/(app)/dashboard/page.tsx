import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";

const quickStarts = [
  { href: "/learning", label: "Start learning", detail: "Find your next path" },
  { href: "/documentation", label: "Browse docs", detail: "Open the club library" },
  { href: "/projects", label: "See projects", detail: "Explore work in motion" },
  { href: "/operations", label: "Check operations", detail: "Keep up with the club" },
];

export default function DashboardPage() {
  return (
    <AppShell
      activeHref="/dashboard"
      eyebrow="Club workspace"
      title="A clear place to begin."
      description="Your workspace will bring the club’s learning, knowledge, projects, and operations into one calm view."
      actions={
        <Link className="button" href="/learning">
          Take the first step
        </Link>
      }
    >
      <section className="hero-panel" aria-labelledby="dashboard-overview-title">
        <div>
          <p className="panel-kicker">Foundation preview</p>
          <h2 id="dashboard-overview-title">The foundation is ready.</h2>
          <p>
            Authentication and live workspace data arrive next. For now, use
            the areas below to see how the platform will be organized.
          </p>
        </div>
        <span className="hero-panel-mark" aria-hidden="true">
          01
        </span>
      </section>

      <PrototypeNotice />

      <div className="dashboard-grid">
        <section className="surface-card" aria-labelledby="quick-start-title">
          <div className="card-topline">
            <span className="card-label">Workspace map</span>
            <span className="card-index">04</span>
          </div>
          <h2 id="quick-start-title">Choose a direction.</h2>
          <div className="quick-start-list">
            {quickStarts.map((item) => (
              <Link className="quick-start" href={item.href} key={item.href}>
                <span>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="surface-card activity-card" aria-labelledby="activity-title">
          <div className="card-heading">
            <div>
              <span className="panel-kicker">Recent activity</span>
              <h2 id="activity-title">Your activity</h2>
              <p>Continue where you left off</p>
            </div>
            <span className="badge">This week</span>
          </div>
          <div className="activity-list">
            <div className="activity-item"><span className="activity-icon">↗</span><div><strong>Frontend foundations</strong><span>Lesson 3 of 8 · Continue learning</span></div><span className="activity-time">Today</span></div>
            <div className="activity-item"><span className="activity-icon">✦</span><div><strong>Project brief saved</strong><span>Website refresh · Draft</span></div><span className="activity-time">Yesterday</span></div>
            <EmptyState title="More activity will appear here" description="Join a path or project to make this timeline useful." />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
