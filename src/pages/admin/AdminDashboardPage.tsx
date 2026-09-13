import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheckIcon,
  CircleUserIcon,
  LayersIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

import { getDashboardSummary } from "@/lib/api/admin";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { QueryErrorState } from "@/components/ui/async";
import { Skeleton } from "@/components/ui/primitives";
import { PageHeader, SectionHeader } from "@/components/ui/page";

const tiles = [
  { key: "total_users", label: "Total users", icon: UsersIcon, to: "/admin/members" },
  { key: "active_users", label: "Active users", icon: BadgeCheckIcon, to: "/admin/members?is_active=true" },
  { key: "incomplete_profiles", label: "Incomplete profiles", icon: CircleUserIcon, to: "/admin/members" },
  { key: "total_sigs", label: "Total SIGs", icon: LayersIcon, to: "/admin/sigs" },
  { key: "active_sigs", label: "Active SIGs", icon: ShieldCheckIcon, to: "/admin/sigs" },
] as const;

export default function AdminDashboardPage() {
  useDocumentTitle("Administration");
  const query = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getDashboardSummary,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Administration" description="Club-wide accounts, SIGs, and membership at a glance." />

      {query.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {tiles.map((tile) => (
            <Skeleton key={tile.key} className="h-28" />
          ))}
        </div>
      ) : query.isError ? (
        <QueryErrorState error={query.error} retry={() => query.refetch()} />
      ) : (
        <>
          <section aria-label="Summary" className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-5">
            {tiles.map(({ key, label, icon: Icon, to }) => (
              <Link
                key={key}
                to={to}
                className="hover:bg-muted/40 group border-b py-4 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="text-primary size-4" aria-hidden />
                  <p className="text-muted-foreground text-xs">{label}</p>
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{query.data[key]}</p>
              </Link>
            ))}
          </section>

          <section aria-label="Role distribution" className="max-w-xl">
            <div>
              <SectionHeader title="Role distribution" />
              <ul className="mt-3 flex flex-col gap-2">
                {Object.entries(query.data.role_counts).map(([role, count]) => (
                  <li key={role} className="flex items-center gap-3 text-sm">
                    <span className="w-28 shrink-0 font-medium">{role}</span>
                    <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{
                          width: `${Math.max(4, (count / Math.max(...Object.values(query.data.role_counts))) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground w-8 text-right tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
