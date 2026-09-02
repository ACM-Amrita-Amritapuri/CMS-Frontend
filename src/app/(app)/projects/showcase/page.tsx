import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";
import { demoProjects } from "@/lib/prototype/content";

export default function ProjectShowcasePage() {
  return (
    <AppShell activeHref="/projects" eyebrow="Projects · Finished work" title="Project showcase" description="A place for finished work to teach the next member what is possible." actions={<Link className="button-secondary" href="/projects">Back to projects</Link>}>
      <PrototypeNotice />
      <section className="content-hero showcase-hero"><div><p className="panel-kicker">Selected by the community</p><h2>Make the outcome as visible as the effort.</h2><p>Show the result, the people behind it, and the lesson worth carrying into the next project.</p></div><span className="badge">03 featured</span></section>
      <section className="showcase-feature surface-card" aria-labelledby="showcase-feature-title"><div className="showcase-art"><span className="project-mark">W</span><span>01</span></div><div><p className="panel-kicker">Web Development · Shipped Mar 2026</p><h2 id="showcase-feature-title">Good first issue finder</h2><p>We made it easier for a new contributor to find a project with a clear scope, a welcoming maintainer, and a realistic first step.</p><div className="tag-list"><span>Open Source</span><span>3 contributors</span><span>Used by 42 members</span></div><Link className="card-link" href="/projects/issue-finder">Read the project story <span aria-hidden="true">↗</span></Link></div></section>
      <section className="project-grid" aria-labelledby="more-showcase-title"><div className="section-heading"><div><p className="eyebrow">More to explore</p><h2 id="more-showcase-title">Recent outcomes.</h2></div></div><div className="project-card-grid">{demoProjects.slice(0, 2).map((project) => <article className="surface-card project-card showcase-card" key={project.slug}><div className="card-topline"><span className="card-label">{project.sig}</span><span className="badge">{project.stage}</span></div><span className="project-mark project-mark-purple">{project.title[0]}</span><h2><Link href={`/projects/${project.slug}`}>{project.title}</Link></h2><p>{project.description}</p><Link className="card-link" href={`/projects/${project.slug}`}>View story <span aria-hidden="true">↗</span></Link></article>)}</div></section>
    </AppShell>
  );
}
