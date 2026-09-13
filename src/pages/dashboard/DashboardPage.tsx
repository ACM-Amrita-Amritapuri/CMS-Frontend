import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  FolderKanbanIcon,
  GraduationCapIcon,
} from "lucide-react";

import { getMyProfile } from "@/lib/api/members";
import { useSession } from "@/app/providers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const quickLinks = [
  { to: "/learning", label: "Learning", description: "Paths, lessons, and assignments", icon: GraduationCapIcon },
  { to: "/documentation", label: "Documentation", description: "Club knowledge base", icon: BookOpenIcon },
  { to: "/projects", label: "Projects", description: "Build with a team", icon: FolderKanbanIcon },
  { to: "/operations", label: "Operations", description: "Events and meetings", icon: CalendarDaysIcon },
];

export default function DashboardPage() {
  useDocumentTitle("Dashboard");
  const { user } = useSession();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, <span className="text-primary">{user?.username ?? "member"}</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here&apos;s what&apos;s happening across the club.
        </p>
      </header>

      <section aria-label="Quick links" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map(({ to, label, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="bg-card hover:border-primary group rounded-lg border border-l-2 p-4 transition-colors"
          >
            <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex size-9 items-center justify-center rounded-lg transition-colors">
              <Icon className="size-4" />
            </div>
            <p className="mt-3 text-sm font-semibold">{label}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
          </Link>
        ))}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
        <ProfilePanel />
      </div>
    </div>
  );
}

function ProfilePanel() {
  const query = useQuery({ queryKey: ["profile", "me"], queryFn: getMyProfile });

  return (
    <AsyncBoundary
      query={query}
      empty={{ title: "No profile yet", description: "Complete your profile to personalize this space." }}
    >
      {(profile) => (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="bg-primary/15 text-primary flex size-11 items-center justify-center rounded-full text-base font-bold">
                {(profile.real_name || profile.username).slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{profile.real_name || profile.username}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {profile.year ? `Year ${profile.year} · ` : ""}
                  {profile.branch || profile.roll_number}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {profile.skills.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-[10px]">
                  {skill}
                </Badge>
              ))}
            </div>
            <Button asChild variant="outline" size="sm" className="self-start">
              <Link to="/profile">View profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </AsyncBoundary>
  );
}
