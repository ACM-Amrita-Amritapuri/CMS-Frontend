export default function HomePage() {
  return (
    <main className="page-container">
      <section className="welcome-card" aria-labelledby="welcome-title">
        <p className="eyebrow">ACM club platform</p>
        <h1 id="welcome-title">ACM CMS</h1>
        <p className="muted-text">
          Learning, documentation, projects, and club operations in one place.
        </p>
        <nav aria-label="Primary navigation">
          <a className="button" href="/login">
            Sign in
          </a>
        </nav>
      </section>
    </main>
  );
}
