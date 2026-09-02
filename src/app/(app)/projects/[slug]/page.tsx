import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";
import { demoProjects } from "@/lib/prototype/content";

const project = demoProjects[0];

export default function ProjectDetailPage() {
  return (
    <AppShell activeHref="/projects" eyebrow={`Project · ${project.sig}`} title="Website refresh" description={project.description} actions={<Link className="button-secondary" href="/projects">Back to projects</Link>}>
      <PrototypeNotice />
      <section className="project-detail-hero surface-card"><div><span className="project-mark">W</span><p className="panel-kicker">In progress · Started Jan 2026</p><h2>Build a calmer first impression.</h2><p>Give members and visitors a clear way into the club, with less noise and more confidence about where to begin.</p></div><div className="project-detail-status"><strong>68%</strong><span>brief to launch</span></div></section>
      <div className="content-two-column"><section className="surface-card project-story" aria-labelledby="project-context-title"><div className="card-heading"><div><span className="panel-kicker">Project context</span><h2 id="project-context-title">What we are solving.</h2></div></div><p>Our current website tells people what the club has done, but not how to find a place in what happens next. This refresh makes the path from curiosity to contribution visible.</p><h3>Success looks like</h3><ul className="check-list"><li>A new member can find the right SIG in under two minutes.</li><li>Project work has a clear home and visible next action.</li><li>Every core page works on a phone and with a keyboard.</li></ul></section><aside className="surface-card project-team"><span className="panel-kicker">People</span><h2>Team and roles</h2><ul className="simple-list"><li><strong>Aanya Sharma</strong><span>Project lead · Web Development</span></li><li><strong>Kabir Mehta</strong><span>Content and integrations</span></li><li><strong>Meera Iyer</strong><span>Visual direction</span></li><li><strong>Rohan Das + 3</strong><span>Engineering contributors</span></li></ul><Link className="text-link" href="/members">Find collaborators →</Link></aside></div>
      <section className="surface-card milestone-panel project-milestones" aria-labelledby="milestones-title"><div className="card-heading"><div><span className="panel-kicker">Delivery</span><h2 id="milestones-title">Milestones</h2></div><span className="badge">Next review Mar 16</span></div><ol className="timeline-list"><li><span className="timeline-date">Done</span><span><strong>Project brief approved</strong><small>Jan 24 · Web Development SIG</small></span></li><li><span className="timeline-date">Done</span><span><strong>First content audit</strong><small>Feb 12 · 18 pages reviewed</small></span></li><li><span className="timeline-date">Current</span><span><strong>Prototype review</strong><small>Three flows ready for feedback</small></span></li><li><span className="timeline-date">Next</span><span><strong>Build the first release</strong><small>Target · Mar 28</small></span></li></ol></section>
    </AppShell>
  );
}
