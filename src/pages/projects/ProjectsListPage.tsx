import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLinkIcon, FolderKanbanIcon } from "lucide-react";

import { listProjectDirectory } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AsyncBoundary } from "@/components/ui/async";
import { MemberGitHubProjectCard } from "@/components/projects/member-github-project-card";
import { EmptyState } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page";

export default function ProjectsListPage() {
  useDocumentTitle("Projects");
  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: ({ signal }) => listProjectDirectory(signal),
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Projects" description="Explore members' GitHub projects and live demos." />

      <section aria-label="Member projects">
        <AsyncBoundary
          query={projectsQuery}
          isEmpty={(members) => members.length === 0}
          empty={{
            icon: FolderKanbanIcon,
            title: "No member projects yet",
            description: "Member projects will appear here once their GitHub data is available.",
          }}
        >
          {(members) => (
            <div className="flex flex-col gap-8">
              {members.map((member) => (
                <section key={member.user_id} aria-labelledby={`member-projects-${member.user_id}`} className="min-w-0">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 id={`member-projects-${member.user_id}`} className="min-w-0 text-lg font-semibold [overflow-wrap:anywhere]">
                      <Link
                        to={`/portfolio/${member.user_id}`}
                        className="focus-visible:ring-ring hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      >
                        {member.display_name}
                      </Link>
                    </h2>
                    {member.github_url ? (
                      <a
                        href={member.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.display_name}'s GitHub profile (opens in a new tab)`}
                        className="text-muted-foreground focus-visible:ring-ring inline-flex min-h-10 items-center gap-1.5 text-sm hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      >
                        GitHub profile <ExternalLinkIcon aria-hidden="true" className="size-3" />
                      </a>
                    ) : null}
                  </div>
                  {member.projects.length === 0 ? (
                    <EmptyState
                      icon={FolderKanbanIcon}
                      title="No GitHub projects yet"
                      description="This member's projects will appear once their GitHub data is available."
                    />
                  ) : (
                    <ul className="grid gap-4 md:grid-cols-2">
                      {member.projects.map((project) => (
                        <li key={project.repository_id} className="min-w-0">
                          <MemberGitHubProjectCard project={project} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          )}
        </AsyncBoundary>
      </section>
    </div>
  );
}
