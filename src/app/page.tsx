import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            A
          </span>
          <span>ACM CMS</span>
        </Link>
        <span className="landing-status">
          <span className="status-dot" aria-hidden="true" />
          Foundation preview
        </span>
      </header>

      <section className="landing-hero" aria-labelledby="welcome-title">
        <div className="landing-copy">
          <p className="eyebrow">ACM club platform</p>
          <h1 id="welcome-title">A calmer way to build together.</h1>
          <p className="landing-description">
            A focused home for learning, documentation, projects, and the work
            that keeps your club moving.
          </p>
          <div className="landing-actions">
            <Link className="button" href="/dashboard">
              Open workspace
            </Link>
            <a className="text-link" href="#workspace-areas">
              Explore the platform <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className="landing-panel" aria-hidden="true">
          <div className="landing-panel-glow" />
          <div className="landing-panel-content">
            <span className="panel-kicker">Your club, in focus</span>
            <strong>Make room for the next good idea.</strong>
            <span className="landing-panel-line" />
            <span className="landing-panel-note">Designed for clarity, built for momentum.</span>
          </div>
        </div>
      </section>

      <section id="workspace-areas" className="area-section" aria-labelledby="area-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Workspace areas</p>
            <h2 id="area-title">Everything has a place.</h2>
          </div>
          <p>Start with one area. The rest stays close when you need it.</p>
        </div>
        <nav className="area-grid" aria-label="Workspace areas">
          <Link className="area-card" href="/learning">
            <span className="card-index">01</span>
            <strong>Learning</strong>
            <span>Paths, lessons, and progress.</span>
          </Link>
          <Link className="area-card" href="/documentation">
            <span className="card-index">02</span>
            <strong>Documentation</strong>
            <span>A library that stays useful.</span>
          </Link>
          <Link className="area-card" href="/projects">
            <span className="card-index">03</span>
            <strong>Projects</strong>
            <span>Ideas into teams and outcomes.</span>
          </Link>
          <Link className="area-card" href="/operations">
            <span className="card-index">04</span>
            <strong>Operations</strong>
            <span>Keep the club in motion.</span>
          </Link>
        </nav>
      </section>
    </main>
  );
}
