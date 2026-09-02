import Link from "next/link";

const navigation = [
  { href: "/dashboard", label: "Dashboard", index: "01" },
  { href: "/learning", label: "Learning", index: "02" },
  { href: "/documentation", label: "Documentation", index: "03" },
  { href: "/projects", label: "Projects", index: "04" },
  { href: "/operations", label: "Operations", index: "05" },
];

function Brand() {
  return (
    <Link className="brand" href="/">
      <span className="brand-mark" aria-hidden="true">
        A
      </span>
      <span>ACM CMS</span>
    </Link>
  );
}

function Navigation({ label, activeHref }: { label: string; activeHref: string }) {
  return (
    <nav aria-label={label}>
      <ul className="nav-list">
        {navigation.map((item) => (
          <li key={item.href}>
            <Link
              className={`nav-link${activeHref === item.href ? " nav-link-active" : ""}`}
              href={item.href}
              aria-current={activeHref === item.href ? "page" : undefined}
            >
              <span className="nav-index" aria-hidden="true">
                {item.index}
              </span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

interface AppShellProps {
  activeHref: string;
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function AppShell({
  activeHref,
  eyebrow,
  title,
  description,
  actions,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <p className="sidebar-kicker">Club workspace</p>
        <Navigation label="Primary navigation" activeHref={activeHref} />
        <div className="sidebar-footer">
          <span className="status-dot" aria-hidden="true" />
          <span>Foundation preview</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="topbar-meta">
            <span className="topbar-status">
              <span className="status-dot" aria-hidden="true" />
              Preview mode
            </span>
            <span className="user-chip">Guest workspace</span>
          </div>
        </header>

        <main className="workspace-main">
          <header className="page-heading">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              <p className="page-description">{description}</p>
            </div>
            {actions ? <div className="page-actions">{actions}</div> : null}
          </header>
          {children}
        </main>

        <div className="mobile-nav-wrap">
            <Navigation label="Mobile navigation" activeHref={activeHref} />
        </div>
      </div>
    </div>
  );
}
