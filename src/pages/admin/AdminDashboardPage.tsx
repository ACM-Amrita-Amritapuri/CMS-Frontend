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
import { Button } from "@/components/ui/button";
import { PageHeader, SectionHeader } from "@/components/ui/page";
import { AdminShell } from "@/components/admin/admin-shell";

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
    <AdminShell>
      <div className="flex flex-col gap-6">
      <PageHeader title="Administration" description="Operate the club: manage accounts, roles, SIGs, and view membership at a glance." />

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
          <section aria-label="Quick actions" className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" className="border-[#333333] text-white hover:bg-[#111111]">
          <Link to="/admin/members">Manage members</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="border-[#333333] text-white hover:bg-[#111111]">
          <Link to="/admin/sigs">Manage SIGs</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="border-[#333333] text-white hover:bg-[#111111]">
          <Link to="/admin/accounts">Create account</Link>
        </Button>
      </section>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {tiles.map(({ key, label, icon: Icon, to }) => (
              <Link
                key={key}
                to={to}
                className="group rounded-lg border border-[#1f1f1f] bg-[#050505] p-4 transition-colors hover:border-[#333333] hover:bg-[#111111]"
              >
                <div className="flex items-center gap-2">
                  <Icon className="text-primary size-4" aria-hidden />
                  <p className="text-xs font-medium uppercase tracking-wide text-[#a1a1aa]">{label}</p>
                </div>
                <p className="mt-3 text-3xl font-bold tabular-nums text-white">{query.data[key]}</p>
              </Link>
            ))}
          </section>

          <section aria-label="Role distribution" className="max-w-xl rounded-lg border border-[#1f1f1f] bg-[#050505] p-5">
            <div>
              <SectionHeader title="Role distribution" />
              <ul className="mt-4 flex flex-col gap-3">
                {Object.entries(query.data.role_counts).map(([role, count]) => (
                  <li key={role} className="flex items-center gap-3 text-sm text-[#f4f4f5]">
                    <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-[#71717a]">{role}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#111111]">
                      <div
                        className="h-full rounded-full bg-[#ffffff]"
                        style={{
                          width: `${Math.max(4, (count / Math.max(...Object.values(query.data.role_counts))) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right tabular-nums text-[#f4f4f5]">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}
      </div>
    </AdminShell>
  );
}
