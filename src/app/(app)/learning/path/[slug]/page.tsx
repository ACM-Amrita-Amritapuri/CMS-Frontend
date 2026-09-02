import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import ProgressBar from "@/components/content/ProgressBar";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";

const lessons = [
  { title: "The interface as a system", detail: "Foundations · 12 min", state: "Complete" },
  { title: "Designing for real content", detail: "Layout · 18 min", state: "Complete" },
  { title: "Making responsive choices", detail: "Practice · 24 min", state: "Current" },
  { title: "States are part of the design", detail: "Interaction · 16 min", state: "Next" },
  { title: "Forms people can finish", detail: "Accessibility · 20 min", state: "Locked" },
  { title: "Feedback and error recovery", detail: "Interaction · 15 min", state: "Locked" },
  { title: "A small component audit", detail: "Practice · 30 min", state: "Locked" },
  { title: "Ship the useful version", detail: "Reflection · 10 min", state: "Locked" },
];

export default function LearningPathPage() {
  return (
    <AppShell
      activeHref="/learning"
      eyebrow="Learning path · Web Development"
      title="Frontend foundations"
      description="Build a sturdy mental model for accessible, responsive interfaces through eight short lessons."
      actions={<Link className="button-secondary" href="/learning/assignments">View assignments</Link>}
    >
      <PrototypeNotice />
      <section className="content-hero path-hero" aria-labelledby="path-hero-title">
        <div><p className="panel-kicker">In progress · Beginner → intermediate</p><h2 id="path-hero-title">You are building the right habits.</h2><p>One practical lesson is ready now. Finish it, then use the reflection to make the idea part of your next project.</p></div>
        <div className="path-hero-stat"><strong>62%</strong><span>complete</span></div>
      </section>
      <section className="surface-card progress-summary" aria-labelledby="path-progress-title">
        <div className="card-heading"><div><span className="panel-kicker">Path progress</span><h2 id="path-progress-title">Lesson 3 of 8</h2></div><span className="badge">3 hours remaining</span></div>
        <ProgressBar label="Frontend foundations" value={5} max={8} />
      </section>
      <div className="content-two-column">
        <section className="surface-card" aria-labelledby="lessons-title"><div className="card-heading"><div><span className="panel-kicker">Curriculum</span><h2 id="lessons-title">Work through the lessons.</h2></div></div><ol className="lesson-list">{lessons.map((lesson, index) => <li className={`lesson-item lesson-${lesson.state.toLowerCase()}`} key={lesson.title}><span className="lesson-number">{String(index + 1).padStart(2, "0")}</span><span><strong>{lesson.title}</strong><span>{lesson.detail}</span></span><span className="badge">{lesson.state}</span></li>)}</ol></section>
        <aside className="surface-card path-aside"><span className="panel-kicker">Next action</span><h2>Make responsive choices</h2><p>Practice turning a fixed layout into a calm experience across screen sizes.</p><Link className="button" href="/learning/assignments">Start lesson <span aria-hidden="true">↗</span></Link><div className="aside-note"><strong>What you will need</strong><span>20 minutes · a project you care about · your notes</span></div></aside>
      </div>
      <section className="surface-card resource-panel" aria-labelledby="resources-title"><div className="card-heading"><div><span className="panel-kicker">Resources</span><h2 id="resources-title">Go a little deeper.</h2></div><Link className="text-link" href="/documentation">Browse all docs →</Link></div><div className="resource-grid"><Link href="/documentation/accessible-ui-basics"><strong>Accessible UI basics</strong><span>Reference · 8 min read</span></Link><Link href="/documentation/getting-started"><strong>How we review project briefs</strong><span>Guide · 6 min read</span></Link></div></section>
    </AppShell>
  );
}
