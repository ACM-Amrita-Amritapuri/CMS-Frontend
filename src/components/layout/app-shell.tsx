"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/theme";
import {
  BookOpenIcon,
  ChartPieIcon,
  FolderKanbanIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MegaphoneIcon,
  MenuIcon,
  MoonIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";

import { logout, logoutAll } from "@/lib/api/auth";
import { useSession } from "@/app/providers";
import { UserAvatar } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandPalette } from "@/components/layout/command-palette";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/learning", label: "Learning", icon: GraduationCapIcon },
  { href: "/documentation", label: "Documentation", icon: BookOpenIcon },
  { href: "/projects", label: "Projects", icon: FolderKanbanIcon },
  { href: "/operations", label: "Operations", icon: MegaphoneIcon },
  { href: "/members", label: "Members", icon: UsersIcon },
  { href: "/admin", label: "Admin", icon: SettingsIcon, capability: "administer" as const },
];

const roleLabels: Record<string, string> = {
  MEMBER: "Member",
  SIG_CORE: "SIG Core",
  SIG_LEAD: "SIG Lead",
  WEBMASTER: "Webmaster",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex min-h-svh">
      <Sidebar className="hidden lg:flex" />

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <Sidebar className="animate-slide-up fixed inset-y-0 left-0 z-50 w-64" onNavigate={() => setMobileOpen(false)} />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-40 flex h-14 items-center gap-2 border-b px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground w-56 justify-start gap-2"
            onClick={() => setPaletteOpen(true)}
          >
            <SearchIcon className="size-3.5" />
            Search…
            <kbd className="bg-muted ml-auto rounded px-1.5 font-mono text-[10px]">⌘K</kbd>
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user, hasCapability } = useSession();

  return (
    <aside
      className={`bg-sidebar flex w-64 shrink-0 flex-col border-r ${className ?? ""}`}
    >
      <Link href="/dashboard" className="flex h-14 items-center gap-2.5 border-b px-4 font-semibold">
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold">
          A
        </span>
        ACM CMS
      </Link>

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Primary">
        <ul className="flex flex-col gap-0.5">
          {navigation
            .filter((item) => !item.capability || hasCapability(item.capability))
            .map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                    {active ? (
                      <span className="bg-primary ml-auto size-1.5 rounded-full" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              );
            })}
        </ul>
      </nav>

      {user ? (
        <div className="border-t p-3">
          <Link
            href="/profile"
            onClick={onNavigate}
            className="hover:bg-sidebar-accent/60 flex items-center gap-2.5 rounded-lg p-2 transition-colors"
          >
            <UserAvatar name={user.username} className="size-8" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{user.username}</span>
              <span className="text-muted-foreground block truncate text-xs">
                {topRole(user.role_assignments.map((a) => a.role_code))}
              </span>
            </span>
          </Link>
        </div>
      ) : null}
    </aside>
  );
}

function topRole(roles: string[]) {
  const order = ["SUPER_ADMIN", "ADMIN", "WEBMASTER", "SIG_LEAD", "SIG_CORE", "MEMBER"];
  const top = order.find((role) => roles.includes(role));
  return top ? roleLabels[top] : "Member";
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* CSS picks the icon so SSR and client markup always match. */}
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </Button>
  );
}

function UserMenu() {
  const { user } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!user) return null;

  const signOut = (fn: typeof logout) =>
    fn()
      .catch(() => undefined) // Clear local state regardless of server outcome.
      .finally(() => {
        queryClient.clear();
        sessionCleared(router);
      });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu">
          <UserAvatar name={user.username} className="size-7" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>
          <span className="block truncate">{user.username}</span>
          <span className="text-muted-foreground block truncate text-xs font-normal">
            {user.roll_number}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <ChartPieIcon /> My profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/change-password")}>
          <SettingsIcon /> Change password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut(logout)}>
          <LogOutIcon /> Log out
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut(logoutAll)}
        >
          <XIcon /> Log out everywhere
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function sessionCleared(router: ReturnType<typeof useRouter>) {
  router.replace("/login");
}
