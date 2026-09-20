import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheckIcon,
  CircleUserIcon,
  UsersIcon,
} from "lucide-react";

import { getDashboardSummary } from "@/lib/api/admin";
import { queryKeys } from "@/lib/query-keys";
import { useSession } from "@/app/providers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { QueryErrorState } from "@/components/ui/async";
import { Skeleton } from "@/components/ui/primitives";
import { PageHeader, SectionHeader } from "@/components/ui/page";
import { AdminShell } from "@/components/admin/admin-shell";

const tiles = [
  { key: "total_users", label: "Total users", icon: UsersIcon, to: "/admin/members" },
  { key: "active_users", label: "Active users", icon: BadgeCheckIcon, to: "/admin/members?is_active=true" },
  { key: "incomplete_profiles", label: "Incomplete profiles", icon: CircleUserIcon, to: "/admin/members" },
] as const;

export default function AdminDashboardPage() {
  useDocumentTitle("Dashboard");
  const { user } = useSession();
  const isSuperAdmin = user?.role_assignments.some(({ role_code }) => role_code === "SUPER_ADMIN") ?? false;
  const query = useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: ({ signal }) => getDashboardSummary(signal),
  });

  return (
    <AdminShell>
      <div className="flex flex-col gap-8">
        <PageHeader
          title={isSuperAdmin ? "Super admin dashboard" : "Admin dashboard"}
        />

        {query.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map((tile) => (
              <Skeleton key={tile.key} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : query.isError ? (
          <QueryErrorState error={query.error} retry={() => query.refetch()} />
        ) : (
          <>
            <section aria-label="Club snapshot">
              <SectionHeader
                title="Club snapshot"
              />
              <div aria-label="Summary" className="mt-4 grid border-y sm:grid-cols-3">
                {tiles.map(({ key, label, icon: Icon, to }) => (
                  <Link
                    key={key}
                    to={to}
                    className="group min-w-0 border-b px-1 py-5 transition-colors hover:bg-muted/30 last:border-b-0 sm:border-r sm:border-b-0 sm:px-4 sm:last:border-r-0"
                  >
                    <div className="flex min-h-8 items-start gap-2">
                      <Icon className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
                      <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">{label}</p>
                    </div>
                    <p className="mt-3 text-4xl font-extrabold tabular-nums text-foreground">{query.data[key]}</p>
                  </Link>
                ))}
              </div>
            </section>

          </>
        )}

      </div>
    </AdminShell>
  );
}
