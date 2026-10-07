import { ExternalLinkIcon } from "lucide-react";

import type { MemberGitHubProject } from "@/lib/api/projects";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function MemberGitHubProjectCard({ project }: { project: MemberGitHubProject }) {
  return (
    <Card className="h-full p-4 sm:p-5">
      <h3 className="break-words text-base font-semibold leading-6 [overflow-wrap:anywhere]">
        {project.name}
      </h3>
      {project.description ? (
        <p className="text-muted-foreground break-words text-sm leading-6 [overflow-wrap:anywhere]">
          {project.description}
        </p>
      ) : null}
      {project.language ? (
        <Badge variant="secondary" className="max-w-full self-start whitespace-normal [overflow-wrap:anywhere]">
          {project.language}
        </Badge>
      ) : null}
      <div className="mt-auto flex flex-wrap gap-2 border-t pt-3">
        {[
          { url: project.repository_url, label: "GitHub repository" },
          { url: project.demo_url, label: "Live demo" },
        ].map(({ url, label }) => url ? (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} for ${project.name} (opens in a new tab)`}
            className="border-input hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px]"
          >
            {label} <ExternalLinkIcon aria-hidden="true" className="size-3 opacity-60" />
          </a>
        ) : null)}
      </div>
    </Card>
  );
}
