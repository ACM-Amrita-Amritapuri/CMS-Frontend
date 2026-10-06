import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FolderKanbanIcon,
  GraduationCapIcon,
  UsersIcon,
} from "lucide-react";

import { normalizeId, queryKeys } from "@/lib/query-keys";
import { getPortfolio } from "@/lib/api/members";
import { ProfileCard } from "@/components/member/profile-card";
import { MemberGitHubProjectCard } from "@/components/projects/member-github-project-card";
import { formatDate } from "@/lib/formatters/date";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/table";
import { QueryState } from "@/components/ui/async";
import { PageHeader } from "@/components/ui/page";

const contentTypeLabels = {
  LESSON: "Lesson",
  ASSIGNMENT: "Assignment",
} as const;

export default function PortfolioPage() {
  useDocumentTitle("Portfolio");
  const { userId } = useParams();
  const numericUserId = Number(userId);
  const query = useQuery({
    queryKey: queryKeys.portfolio.detail(userId),
    queryFn: ({ signal }) => getPortfolio(numericUserId, signal),
    retry: false,
    enabled: normalizeId(userId) !== null,
  });

  if (normalizeId(userId) === null) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Portfolio not found"
        description="This member doesn't have a visible portfolio."
      />
    );
  }
  return (
    <QueryState query={query} notFound="Portfolio not found">
      {({ profile, learning_achievements, github_projects }) => (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${profile.real_name || profile.username}'s portfolio`}
        description="Learning achievements and GitHub projects."
        backTo={{ label: "Back to members", to: "/members" }}
      />

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <ProfileCard profile={profile} />
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-label="Learning achievements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-2 text-base leading-snug [&>svg]:mt-0.5 [&>svg]:shrink-0">
                  <GraduationCapIcon className="size-4" /> Learning achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {learning_achievements.length === 0 ? (
                  <EmptyState
                    icon={GraduationCapIcon}
                    title="No completions yet"
                    className="py-8"
                  />
                ) : (
                  <ul className="flex flex-col divide-y">
                    {learning_achievements.map((item) => (
                      <li key={item.id} className="flex flex-wrap items-start gap-x-3 gap-y-2 py-4 first:pt-0 last:pb-0">
                        <Badge variant="success" className="shrink-0">
                          {contentTypeLabels[item.content_type]}
                        </Badge>
                        <span className="text-muted-foreground min-w-0 basis-full text-sm leading-relaxed [overflow-wrap:anywhere] sm:flex-1 sm:basis-0">
                          {item.path_title || "Learning path"} · {item.module_title || "Module"}
                        </span>
                        <time className="text-muted-foreground shrink-0 text-xs leading-relaxed sm:ml-auto">
                          {formatDate(item.completed_at)}
                        </time>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          <section aria-label="GitHub projects">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-start gap-2 text-base leading-snug [&>svg]:mt-0.5 [&>svg]:shrink-0">
                  <FolderKanbanIcon className="size-4" /> GitHub projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                {github_projects.length === 0 ? (
                  <EmptyState
                    icon={FolderKanbanIcon}
                    title="No GitHub projects available yet"
                    description="This member's projects will appear once their GitHub data is available."
                    className="py-8"
                  />
                ) : (
                  <ul className="grid gap-4 md:grid-cols-2">
                    {github_projects.map((project) => (
                      <li key={project.repository_id} className="min-w-0">
                        <MemberGitHubProjectCard project={project} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
      )}
    </QueryState>
  );
}
