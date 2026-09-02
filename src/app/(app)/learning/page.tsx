import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import ContentRow from "@/components/content/ContentRow";
import ProgressBar from "@/components/content/ProgressBar";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";
import { demoLearningPaths } from "@/lib/prototype/content";

export default function LearningPage() {
  return (
    <AppShell
      activeHref="/learning"
      eyebrow="Learning space"
      title="Learn with a clear next step."
      description="A focused home for the paths, resources, assignments, and progress that help members grow."
    >
      <PrototypeNotice />
      <section className="content-hero" aria-labelledby="learning-hero-title">
        <div>
          <p className="panel-kicker">Recommended for you</p>
          <h2 id="learning-hero-title">Make the next hour count.</h2>
          <p>Continue your current path, or choose a small, practical lesson to build momentum.</p>
        </div>
        <Link className="button" href="/learning/path/frontend-foundations">Continue path <span aria-hidden="true">↗</span></Link>
      </section>

      <div className="content-stat-grid">
        <section className="surface-card"><span className="panel-kicker">Current streak</span><strong className="content-stat">07 days</strong><span className="field-hint">Keep showing up</span></section>
        <section className="surface-card"><span className="panel-kicker">This week</span><strong className="content-stat">03 lessons</strong><span className="field-hint">One more than last week</span></section>
        <section className="surface-card"><span className="panel-kicker">Assignments</span><strong className="content-stat">02 due</strong><Link className="field-hint text-link" href="/learning/assignments">Review your work →</Link></section>
      </div>

      <section className="content-section" aria-labelledby="paths-title">
        <div className="section-heading"><div><p className="eyebrow">Learning paths</p><h2 id="paths-title">Choose your direction.</h2></div><Link className="text-link" href="/learning/progress">See all progress →</Link></div>
        <div className="content-card-grid">
          {demoLearningPaths.map((path) => (
            <article className="surface-card path-card" key={path.slug}>
              <div className="card-topline"><span className="card-label">{path.category}</span><span className="badge">{path.level}</span></div>
              <h3><Link href={`/learning/path/${path.slug}`}>{path.title}</Link></h3>
              <p>{path.description}</p>
              <ProgressBar label={`${path.completedLessons} of ${path.lessons} lessons`} value={path.completedLessons} max={path.lessons} />
              <Link className="card-link" href={`/learning/path/${path.slug}`}>Open path <span aria-hidden="true">↗</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card content-row-panel" aria-labelledby="learning-links-title">
        <div className="card-heading"><div><span className="panel-kicker">Keep exploring</span><h2 id="learning-links-title">Useful next views</h2></div></div>
        <ContentRow href="/learning/assignments" title="Your assignments" category="Work queue" owner="2 items need attention" updated="Due this week" status="2 open" />
        <ContentRow href="/learning/progress" title="Your progress" category="Overview" owner="4 paths completed" updated="Updated today" status="On track" />
      </section>
    </AppShell>
  );
}
