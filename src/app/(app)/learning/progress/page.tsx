import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import ProgressBar from "@/components/content/ProgressBar";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";

export default function LearningProgressPage() {
  return (
    <AppShell activeHref="/learning" eyebrow="Learning · Personal progress" title="Your progress" description="See the paths you have completed, the habits you are building, and where to go next.">
      <PrototypeNotice />
      <div className="content-stat-grid progress-stat-grid"><section className="surface-card"><span className="panel-kicker">Paths completed</span><strong className="content-stat">4 paths completed</strong><span className="field-hint">Since joining the club</span></section><section className="surface-card"><span className="panel-kicker">Lessons finished</span><strong className="content-stat">28 lessons</strong><span className="field-hint">Across 7 learning paths</span></section><section className="surface-card"><span className="panel-kicker">Learning time</span><strong className="content-stat">19h 40m</strong><span className="field-hint">A steady weekly rhythm</span></section></div>
      <div className="content-two-column">
        <section className="surface-card" aria-labelledby="progress-paths-title"><div className="card-heading"><div><span className="panel-kicker">In motion</span><h2 id="progress-paths-title">Keep these moving.</h2></div><span className="badge">2 active</span></div><div className="progress-stack"><ProgressBar label="Frontend foundations" value={5} max={8} /><ProgressBar label="Research to brief" value={2} max={6} /><ProgressBar label="Open source first steps" value={0} max={5} /></div></section>
        <aside className="surface-card milestone-panel"><span className="panel-kicker">Latest milestone</span><strong className="milestone-mark">04</strong><h2>Four paths complete.</h2><p>You have a useful body of work to point to. Add one reflection to your portfolio when you are ready.</p><Link className="text-link" href="/portfolio/42">View your portfolio →</Link></aside>
      </div>
      <section className="surface-card timeline-panel" aria-labelledby="history-title"><div className="card-heading"><div><span className="panel-kicker">History</span><h2 id="history-title">Recent progress</h2></div><span className="card-label">2026</span></div><ul className="timeline-list"><li><span className="timeline-date">Today</span><span><strong>Completed Designing for real content</strong><small>Frontend foundations · Lesson 2</small></span></li><li><span className="timeline-date">Yesterday</span><span><strong>Submitted responsive layout reflection</strong><small>Frontend foundations · Awaiting review</small></span></li><li><span className="timeline-date">Mar 08</span><span><strong>Completed Accessible interfaces</strong><small>Learning path · 6 lessons</small></span></li></ul></section>
    </AppShell>
  );
}
