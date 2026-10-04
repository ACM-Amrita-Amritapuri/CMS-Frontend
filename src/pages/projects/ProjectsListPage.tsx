import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderKanbanIcon } from "lucide-react";

import { listProjects } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page";

export default function ProjectsListPage() {
  useDocumentTitle("Projects");
  const projectsQuery = useQuery({ queryKey: queryKeys.projects.list(), queryFn: ({ signal }) => listProjects(undefined, signal) });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Projects" description="Track club projects, teams, and progress." />

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
            <ul className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => (

                <li key={project.id} className="min-w-0">
                  <Link
                    to={`/projects/${project.id}`}
                    className="bg-card hover:bg-muted/40 focus-visible:ring-ring flex h-full min-w-0 flex-col gap-4 rounded-xl border p-4 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="min-w-0 break-words text-base font-semibold leading-6 wrap-anywhere">{project.title}</h2>
                      {project.state === "CLOSED" ? <Badge variant="secondary">Closed</Badge> : null}
                    </div>
                    <p className="text-muted-foreground line-clamp-3 break-words text-sm leading-6 wrap-anywhere">{project.summary}</p>
                    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-3 text-xs">
                      <span className="text-muted-foreground w-full">
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
