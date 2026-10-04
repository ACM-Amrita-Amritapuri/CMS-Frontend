import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  FolderKanbanIcon,
  GraduationCapIcon,
} from "lucide-react";

import { getMyProfile } from "@/lib/api/members";
import { queryKeys } from "@/lib/query-keys";
import { useSession } from "@/app/providers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/page";

const quickLinks = [
  { to: "/learning", label: "Learning", description: "Paths, lessons, and assignments", icon: GraduationCapIcon },
  { to: "/documentation", label: "Documentation", description: "Club knowledge base", icon: BookOpenIcon },
  { to: "/projects", label: "Projects", description: "Build with a team", icon: FolderKanbanIcon },
  { to: "/operations", label: "Operations", description: "Events and meetings", icon: CalendarDaysIcon },
];

export const dashboardHeroClassName =
  "relative overflow-hidden rounded-2xl border border-transparent bg-primary px-6 py-8 text-primary-foreground dark:border-white/10 dark:bg-[#111111] dark:text-white sm:px-8 sm:py-10";

export default function DashboardPage() {
  useDocumentTitle("Dashboard");
  const { user, hasCapability } = useSession();
  const isAdmin = hasCapability("administer");

  if (isAdmin) {
    return <AdminDashboardPage />;
  }

  return (
    <div className="flex flex-col gap-8">
      <section className={dashboardHeroClassName}>
        <div className="relative z-10 max-w-2xl">
          <p className="text-primary-foreground/65 text-[10px] font-semibold uppercase tracking-[0.18em] dark:text-white/65">
            ACM member workspace
          </p>
          <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-balance wrap-anywhere sm:text-4xl">
            Welcome back, {user?.username ?? "member"}
          </h1>
          <p className="text-primary-foreground/70 mt-3 max-w-xl text-sm leading-6 sm:text-base dark:text-white/70">
            Pick up where you left off, find a project to join, or catch up on what the club is running this week.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button asChild variant="secondary" className="rounded-2xl">
              <Link to="/learning">Continue learning</Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-2xl text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground dark:text-white dark:hover:bg-white/10 dark:hover:text-white">
              <Link to="/projects">Explore projects</Link>
            </Button>
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border border-primary-foreground/10 dark:border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-4 -top-12 size-48 rounded-full border border-primary-foreground/10 dark:border-white/10" />
      </section>

      <section aria-labelledby="explore-heading">
        <SectionHeader title="Explore the workspace" description="The places members use most often." />
        <div className="mt-4 grid border-y sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map(({ to, label, description, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex min-h-28 min-w-0 items-start gap-3 border-b px-1 py-5 transition-colors hover:bg-muted/50 last:border-b-0 sm:border-r sm:px-4 sm:nth-[2n]:border-r-0 sm:nth-last-[-n+2]:border-b-0 lg:border-b-0 lg:nth-2:border-r lg:last:border-r-0"
            >
              <div className="bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors">
                <Icon className="size-4" />
              </div>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="text-muted-foreground mt-1 block text-xs leading-5">{description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="border-t pt-5">
          <SectionHeader title="What’s happening" description="Use the navigation to pick up a current club workflow." />
          <div className="text-muted-foreground mt-5 border-b py-10 text-sm">
            Your latest activity will appear here as you join learning paths, projects, and events.
          </div>
        </section>
        <ProfilePanel />
      </div>
    </div>
  );
}

function ProfilePanel() {
  const query = useQuery({ queryKey: queryKeys.profile.me, queryFn: ({ signal }) => getMyProfile(signal) });

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
              <span className="bg-primary/15 text-primary flex size-11 shrink-0 items-center justify-center rounded-full text-base font-bold">
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
