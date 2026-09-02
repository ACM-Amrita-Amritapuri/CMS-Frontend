import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";
import { primaryMember } from "@/lib/prototype/content";

export default function PortfolioPage() {
  return (
    <AppShell
      activeHref="/members"
      eyebrow="Portfolio · ACM-024"
      title="Aanya’s portfolio"
      description="A focused showcase of the work, learning, and contributions a member wants to carry forward."
      actions={<Link className="button-secondary" href="/members/ACM-024">Back to profile</Link>}
    >
      <PrototypeNotice />
      <section className="portfolio-hero surface-card"><div className="profile-identity"><span className="avatar" aria-hidden="true">{primaryMember.initials}</span><div><p className="panel-kicker">{primaryMember.role} · {primaryMember.sig}</p><h2>{primaryMember.name}</h2><p>{primaryMember.bio}</p></div></div><span className="portfolio-count">06<br /><small>published pieces</small></span></section>
      <section className="portfolio-section" aria-labelledby="featured-projects-title"><div className="section-heading"><div><p className="eyebrow">Selected work</p><h2 id="featured-projects-title">Featured projects</h2></div><span className="card-label">Curated by Aanya</span></div><div className="portfolio-project-grid"><article className="portfolio-project portfolio-project-featured"><span className="project-mark">W</span><p className="panel-kicker">Web Development · 2026</p><h3>Website refresh</h3><p>A calmer, more accessible home for the club’s next chapter.</p><Link className="card-link" href="/projects/website-refresh">View project <span aria-hidden="true">↗</span></Link></article><article className="portfolio-project"><span className="project-mark project-mark-purple">D</span><p className="panel-kicker">Documentation · 2026</p><h3>Reviewing project briefs</h3><p>A practical guide to making collaboration easier to join.</p><Link className="card-link" href="/documentation/getting-started">Read guide <span aria-hidden="true">↗</span></Link></article></div></section>
      <section className="profile-grid"><div className="surface-card"><div className="card-heading"><div><span className="panel-kicker">Learning</span><h2>Completed paths</h2></div><span className="badge">4 complete</span></div><ul className="simple-list"><li><strong>Frontend foundations</strong><span>Completed Mar 2026</span></li><li><strong>Accessible interfaces</strong><span>Completed Feb 2026</span></li></ul></div><div className="surface-card"><div className="card-heading"><div><span className="panel-kicker">Recognition</span><h2>Club contributions</h2></div><span className="badge">12 total</span></div><ul className="simple-list"><li><strong>Learning resource curator</strong><span>Web Development SIG</span></li><li><strong>Welcome session host</strong><span>Operations · January 2026</span></li></ul></div></section>
    </AppShell>
  );
}
