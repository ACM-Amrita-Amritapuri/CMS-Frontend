import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import ContentRow from "@/components/content/ContentRow";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";

export default function LearningAssignmentsPage() {
  return (
    <AppShell activeHref="/learning" eyebrow="Learning · Work queue" title="Your assignments" description="A small, focused list of work that helps you practice what you are learning." actions={<Link className="button" href="/learning/path/frontend-foundations">Continue path</Link>}>
      <PrototypeNotice />
      <div className="filter-bar" aria-label="Assignment filters"><span className="filter-label">Show</span><Link className="filter-chip filter-chip-active" href="/learning/assignments">All <span>4</span></Link><Link className="filter-chip" href="/learning/assignments?status=open">Open <span>2</span></Link><Link className="filter-chip" href="/learning/assignments?status=done">Completed <span>2</span></Link></div>
      <section className="surface-card content-row-panel" aria-labelledby="assignments-title"><div className="card-heading"><div><span className="panel-kicker">This week</span><h2 id="assignments-title">Do the useful work first.</h2></div><span className="badge">2 open</span></div><ContentRow href="/learning/path/frontend-foundations" title="Responsive layout reflection" category="Frontend foundations" owner="Lesson 3 · Practice" updated="Due this week" status="Open" /><ContentRow href="/documentation/new" title="Draft a project brief" category="Research to brief" owner="Lesson 2 · Writing" updated="Due Friday" status="Open" /><ContentRow href="/learning/path/frontend-foundations" title="Interface inventory" category="Frontend foundations" owner="Lesson 2 · Practice" updated="Completed yesterday" status="Done" /><ContentRow href="/documentation/getting-started" title="Review a brief with your SIG" category="Shared practice" owner="Reflection" updated="Completed last week" status="Done" /></section>
      <section className="empty-state compact-empty"><span className="empty-mark" aria-hidden="true">✓</span><div><p className="panel-kicker">Good to know</p><h2>Assignments stay lightweight.</h2><p>The final product should make practice feel finishable, with clear due dates, saved drafts, and an obvious next action.</p></div></section>
    </AppShell>
  );
}
