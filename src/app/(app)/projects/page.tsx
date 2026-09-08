"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FolderKanbanIcon } from "lucide-react";

import { listProjects } from "@/lib/api/projects";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/primitives";

export default function ProjectsPage() {
  const projectsQuery = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track club projects, teams, and progress.
          </p>
        </div>
      </header>

      <section aria-label="Published projects">
        <AsyncBoundary
          query={projectsQuery}
          isEmpty={(projects) => projects.length === 0}
          empty={{
            icon: FolderKanbanIcon,
            title: "No published projects",
            description: "Projects will appear here once they are published.",
          }}
        >
          {(projects) => (
            <ul className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="bg-card hover:border-primary/50 hover:shadow-md flex h-full flex-col gap-3 rounded-xl border p-5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-semibold">{project.title}</h2>
                      {project.state === "CLOSED" ? <Badge variant="secondary">Closed</Badge> : null}
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm">{project.summary}</p>
                    <div className="mt-auto flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">
                        {project.team_memberships.filter((membership) => !membership.left_at).length}/{project.team_capacity} members
                      </span>
                      <Progress value={project.progress} className="h-1.5 flex-1" />
                      <span className="text-muted-foreground tabular-nums">{project.progress}%</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AsyncBoundary>
      </section>
    </div>
  );
}
