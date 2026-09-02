import Link from "next/link";

import type { DemoProject } from "@/lib/prototype/content";

export default function ProjectCard({ project }: { project: DemoProject }) {
  return (
    <article className="surface-card project-card">
      <div className="card-topline"><span className="card-label">{project.sig}</span><span className="badge">{project.stage}</span></div>
      <span className="project-mark">{project.title[0]}</span>
      <h2><Link href={`/projects/${project.slug}`}>{project.title}</Link></h2>
      <p>{project.description}</p>
      <div className="project-card-footer"><span>{project.lead} · {project.contributors} contributors</span><span>{project.updated}</span></div>
    </article>
  );
}
