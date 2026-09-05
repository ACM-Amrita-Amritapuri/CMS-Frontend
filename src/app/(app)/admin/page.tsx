"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheckIcon,
  CircleUserIcon,
  LayersIcon,
  ShieldCheckIcon,
  UserMinusIcon,
  UsersIcon,
} from "lucide-react";

import { getDashboardSummary } from "@/lib/api/admin";
import { AsyncBoundary, QueryErrorState } from "@/components/ui/async";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";

const tiles = [
  { key: "total_users", label: "Total users", icon: UsersIcon, href: "/admin/members" },
  { key: "active_users", label: "Active users", icon: BadgeCheckIcon, href: "/admin/members?is_active=true" },
  { key: "incomplete_profiles", label: "Incomplete profiles", icon: CircleUserIcon, href: "/admin/members" },
  { key: "total_sigs", label: "Total SIGs", icon: LayersIcon, href: "/admin/sigs" },
  { key: "active_sigs", label: "Active SIGs", icon: ShieldCheckIcon, href: "/admin/sigs" },
] as const;

export default function AdminPage() {
  const query = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getDashboardSummary,
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Club-wide accounts, SIGs, and membership at a glance.
        </p>
      </header>

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
          <section aria-label="Summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {tiles.map(({ key, label, icon: Icon, href }) => (
              <Link
                key={key}
                href={href}
                className="bg-card hover:border-primary/50 hover:shadow-md rounded-xl border p-4 transition-all"
              >
                <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                  <Icon className="size-4" />
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums">{query.data[key]}</p>
                <p className="text-muted-foreground text-xs">{label}</p>
              </Link>
            ))}
          </section>

          <section aria-label="Role distribution" className="max-w-xl">
            <div className="bg-card rounded-xl border p-5">
              <h2 className="text-sm font-semibold">Role distribution</h2>
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
