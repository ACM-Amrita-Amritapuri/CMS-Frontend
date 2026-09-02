import AppShell from "@/components/layout/AppShell";
import ProjectCard from "@/components/projects/ProjectCard";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";
import { demoProjects } from "@/lib/prototype/content";
import Link from "next/link";

export default function ProjectsPage() {
  return (
    <AppShell
      activeHref="/projects"
      eyebrow="Projects space"
      title="Turn ideas into visible work."
      description="A shared view for projects, teams, and the outcomes the club is proud to put into the world."
      actions={<Link className="button" href="/projects/new">Create project</Link>}
    >
      <PrototypeNotice />
      <section className="content-hero"><div><p className="panel-kicker">Shared work</p><h2>Make collaboration easier to join.</h2><p>See what is being explored, who is involved, and where a useful contribution fits.</p></div><Link className="button-secondary" href="/projects/showcase">View showcase →</Link></section>
      <div className="filter-bar" aria-label="Project filters"><span className="filter-label">Show</span><Link className="filter-chip filter-chip-active" href="/projects">All projects <span>12</span></Link><Link className="filter-chip" href="/projects?stage=active">In progress <span>06</span></Link><Link className="filter-chip" href="/projects?stage=exploring">Exploring <span>03</span></Link><Link className="filter-chip" href="/projects?stage=shipped">Shipped <span>03</span></Link></div>
      <section className="project-grid" aria-labelledby="projects-title"><div className="section-heading"><div><p className="eyebrow">Project directory</p><h2 id="projects-title">Work in motion.</h2></div><span className="badge">12 projects</span></div><div className="project-card-grid">{demoProjects.map((project) => <ProjectCard key={project.slug} project={project} />)}</div></section>
      <section className="empty-state compact-empty"><span className="empty-mark" aria-hidden="true">+</span><div><p className="panel-kicker">No match state</p><h2>Can’t find the right project?</h2><p>Let members reset filters or propose a new idea without losing the context they already entered.</p><Link className="button-secondary" href="/projects/new">Start a project brief</Link></div></section>
    </AppShell>
  );
}
