import { CodeIcon, ExternalLinkIcon, LinkIcon, TerminalIcon } from "lucide-react";

import type { ProfileView } from "@/lib/api/members";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters/date";

const roleLabels: Record<string, string> = {
  MEMBER: "Member",
  SIG_CORE: "SIG Core",
  SIG_LEAD: "SIG Lead",
  WEBMASTER: "Webmaster",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

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
  const sigNames = profile.club_role?.sig_info ?? {};
  const roles = (profile.club_role?.assignments ?? []).map(
    (assignment) =>
      roleLabels[assignment.role_code] ??
      (assignment.sig_id && sigNames[String(assignment.sig_id)]
        ? `${roleLabels[assignment.role_code] ?? assignment.role_code} · ${sigNames[String(assignment.sig_id)]}`
        : (assignment.role_code)),
  );

  return (
    <div className="bg-card rounded-xl border">
      <div className="from-primary/15 via-primary/5 h-20 rounded-t-xl bg-gradient-to-r to-transparent" />
      <div className="flex flex-col gap-4 px-6 pb-6">
        <div className="-mt-8 flex flex-wrap items-end justify-between gap-3">
          <div className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl border-4 border-card text-xl font-bold shadow-md">
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
