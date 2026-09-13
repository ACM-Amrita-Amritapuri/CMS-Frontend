import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderKanbanIcon } from "lucide-react";

import { listProjects } from "@/lib/api/projects";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page";

export default function ProjectsListPage() {
  useDocumentTitle("Projects");
  const projectsQuery = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });

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
            <ul className="divide-y border-y">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    to={`/projects/${project.id}`}
                    className="hover:bg-muted/40 flex flex-col gap-3 px-1 py-4 transition-colors sm:px-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-semibold">{project.title}</h2>
                      {project.state === "CLOSED" ? <Badge variant="secondary">Closed</Badge> : null}
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm">{project.summary}</p>
                    <div className="flex items-center gap-3 text-xs">
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
