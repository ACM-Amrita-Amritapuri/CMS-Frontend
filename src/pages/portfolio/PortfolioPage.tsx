import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AwardIcon,
  ExternalLinkIcon,
  FolderKanbanIcon,
  GraduationCapIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";

import { getPortfolio } from "@/lib/api/members";
import { ProfileCard } from "@/components/member/profile-card";
import { formatDate } from "@/lib/formatters/date";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/primitives";

const contentTypeLabels = {
  LESSON: "Lesson",
  ASSIGNMENT: "Assignment",
} as const;

export default function PortfolioPage() {
  useDocumentTitle("Portfolio");
  const { userId } = useParams();
  const numericUserId = Number(userId);
  const query = useQuery({
    queryKey: ["portfolio", userId],
    queryFn: () => getPortfolio(numericUserId),
    retry: false,
    enabled: !Number.isNaN(numericUserId),
  });

  if (Number.isNaN(numericUserId)) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Portfolio not found"
        description="This member doesn't have a visible portfolio."
      />
    );
  }
  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-72 w-full max-w-2xl" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Portfolio not found"
        description="This member doesn't have a visible portfolio."
      />
    );
  }

  const { profile, learning_achievements, project_contributions, showcases } =
    query.data;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Learning achievements, project contributions, and showcases.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr]">
        <ProfileCard profile={profile} />
        <div className="flex flex-col gap-6">
          <section aria-label="Learning achievements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
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
                      <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                        <Badge variant="success" className="shrink-0">
                          {contentTypeLabels[item.content_type]}
                        </Badge>
                        <span className="text-muted-foreground text-sm">
                          path #{item.path_id} · module #{item.module_id}
                        </span>
                        <time className="text-muted-foreground ml-auto shrink-0 text-xs">
                          {formatDate(item.completed_at)}
                        </time>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          <section aria-label="Project contributions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderKanbanIcon className="size-4" /> Project contributions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project_contributions.length === 0 ? (
                  <EmptyState
                    icon={FolderKanbanIcon}
                    title="No projects yet"
                    className="py-8"
                  />
                ) : (
                  <ul className="flex flex-col divide-y">
                    {project_contributions.map((item) => (
                      <li key={item.project_id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <Link
                            to={`/projects/${item.project_id}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {item.title}
                          </Link>
                          <p className="text-muted-foreground truncate text-xs">{item.summary}</p>
                        </div>
                        {item.is_lead ? (
                          <Badge className="ml-auto shrink-0">Lead</Badge>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          <section aria-label="Showcases">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrophyIcon className="size-4" /> Showcases
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {showcases.length === 0 ? (
                  <EmptyState
                    icon={AwardIcon}
                    title="No showcases yet"
                    className="py-8"
                  />
                ) : (
                  showcases.map((showcase) => (
                    <div key={showcase.id} className="rounded-lg border p-4">
                      <p className="text-sm leading-relaxed">{showcase.summary}</p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        <span className="font-medium">Tech:</span> {showcase.technology}
                      </p>
                      {showcase.outcomes ? (
                        <p className="text-muted-foreground mt-1 text-xs">
                          <span className="font-medium">Outcomes:</span> {showcase.outcomes}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {([
                          { key: "repository_url", label: "Repository" },
                          { key: "demo_url", label: "Demo" },
                          { key: "deployment_url", label: "Deployment" },
                          { key: "media_url", label: "Media" },
                        ] as const).map(({ key, label }) => {
                          const url = showcase[key];
                          if (!url) return null;
                          return (
                            <a
                              key={key}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="border-input hover:bg-accent inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors"
                            >
                              {label} <ExternalLinkIcon className="size-3 opacity-60" />
                            </a>
                          );
                        })}
                      </div>
                      <p className="text-muted-foreground mt-3 text-xs">
                        Published {formatDate(showcase.published_at)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
