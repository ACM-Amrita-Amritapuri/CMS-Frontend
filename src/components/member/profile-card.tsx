import { CodeIcon, ExternalLinkIcon, LinkIcon, TerminalIcon } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/app/providers";
import { listSigs } from "@/lib/api/admin";
import { queryKeys } from "@/lib/query-keys";
import type { ProfileView } from "@/lib/api/members";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters/date";

import { roleLabels } from "@/lib/auth/permissions";

const socialLinks = [
  { key: "github_url", label: "GitHub", icon: CodeIcon },
  { key: "linkedin_url", label: "LinkedIn", icon: LinkIcon },
  { key: "leetcode_url", label: "LeetCode", icon: CodeIcon },
  { key: "codechef_url", label: "CodeChef", icon: TerminalIcon },
  { key: "codeforces_url", label: "Codeforces", icon: CodeIcon },
  { key: "hackerrank_url", label: "HackerRank", icon: TerminalIcon },
] as const;

export function ProfileCard({
  profile,
  actions,
}: {
  profile: ProfileView;
  actions?: React.ReactNode;
}) {
  const { hasCapability } = useSession();
  const sigNames = profile.club_role?.sig_info ?? {};
  const assignments = profile.club_role?.assignments ?? [];
  const permitted = hasCapability("administer");
  const sigs = useQuery({
    queryKey: queryKeys.sigs.list(),
    queryFn: ({ signal }) => listSigs(undefined, signal),
    enabled: permitted && assignments.some(({ sig_id }) => sig_id !== null && !sigNames[String(sig_id)]),
    retry: false,
  });
  const roles = assignments.map((assignment) => {
    const label = roleLabels[assignment.role_code] ?? assignment.role_code;
    if (assignment.sig_id === null) return label;
    const name = sigNames[String(assignment.sig_id)] ??
      (permitted ? sigs.data?.find((sig) => sig.id === assignment.sig_id)?.name : undefined);
    return `${label} · ${name ?? `SIG ${assignment.sig_id}`}`;
  });

  return (
    <div className="bg-card rounded-lg border">
      <div className="bg-primary/10 h-20 rounded-t-lg" />
      <div className="flex flex-col gap-4 px-6 pb-6">
        <div className="-mt-8 flex flex-wrap items-end justify-between gap-3">
          <div className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-lg border-4 border-card text-xl font-bold">
            {profile.real_name.slice(0, 1).toUpperCase()}
          </div>
          {actions}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{profile.real_name || profile.username}</h2>
          <p className="text-muted-foreground text-sm">
            @{profile.username} · {profile.roll_number}
            {profile.year ? ` · Year ${profile.year}` : ""}
            {profile.branch ? ` · ${profile.branch}` : ""}
          </p>
          {roles.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        {profile.about ? (
          <p className="text-muted-foreground text-sm leading-relaxed">{profile.about}</p>
        ) : null}
        {profile.skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <Badge key={skill} variant="outline">
                {skill}
              </Badge>
            ))}
          </div>
        ) : null}
        {profile.interests || profile.hobbies ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {profile.interests ? (
              <div>
                <dt className="text-muted-foreground text-xs font-medium uppercase">Interests</dt>
                <dd>{profile.interests}</dd>
              </div>
            ) : null}
            {profile.hobbies ? (
              <div>
                <dt className="text-muted-foreground text-xs font-medium uppercase">Hobbies</dt>
                <dd>{profile.hobbies}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {socialLinks.map(({ key, label, icon: Icon }) => {
            const url = profile[key];
            if (!url) return null;
            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-input hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
              >
                <Icon className="size-3.5" />
                {label}
                <ExternalLinkIcon className="size-3 opacity-60" />
              </a>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs">
          Member since {formatDate(profile.created_at)}
        </p>
      </div>
    </div>
  );
}
