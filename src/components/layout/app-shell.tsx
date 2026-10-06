import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/theme";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  ChartPieIcon,
  FolderKanbanIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  LayersIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  TrophyIcon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";

import { logout, logoutAll } from "@/lib/api/auth";
import fullLogoUrl from "@/assets/acm-student-chapter-full-logo.webp";
import darkLogoUrl from "@/assets/acm-student-chapter-full-logo-dark.webp";
import logoUrl from "@/assets/acm-student-chapter-mark.webp";
import { useSession } from "@/app/providers";
import type { Capability } from "@/lib/auth/session-store";
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
import { ContentFrame } from "@/components/ui/page";

const CommandPalette = lazy(() => import("@/components/layout/command-palette").then(({ CommandPalette }) => ({ default: CommandPalette })));

const navigation = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Home", icon: LayoutDashboardIcon },
      { href: "/learning", label: "Learning", icon: GraduationCapIcon },
      { href: "/projects", label: "Projects", icon: FolderKanbanIcon },
      { href: "/documentation", label: "Knowledge", icon: BookOpenIcon },
      { href: "/members", label: "Members", icon: UsersIcon },
      { href: "/hackathons", label: "Events", icon: TrophyIcon },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/admin/members", label: "Manage members", icon: UsersIcon, capability: "administer" as const },
      { href: "/admin/sigs", label: "Manage SIGs", icon: LayersIcon, capability: "administer" as const },
      { href: "/admin/accounts", label: "Accounts", icon: UserPlusIcon, capability: "administer" as const },
      { href: "/operations", label: "Operations", icon: CalendarDaysIcon, capability: "manage_operations" as const },
    ],
  },
];

const SIDEBAR_STORAGE_KEY = "cms-sidebar-collapsed";

import { roleLabel } from "@/lib/auth/permissions";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true",
  );
  const { pathname } = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (
        event.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === "Escape") {
        setMobileOpen(false);
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false));
  }, [pathname]);

  return (
    <div className="min-h-svh bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex"
      />

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <Sidebar className="animate-slide-up fixed inset-y-0 left-0 z-50 w-[260px]" onNavigate={() => setMobileOpen(false)} />
        </div>
      ) : null}

      <div className={`flex min-h-svh min-w-0 flex-col transition-[margin] duration-200 ${sidebarCollapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"}`}>
        <header className="bg-background/90 sticky top-0 z-40 flex h-14 items-center gap-2 border-b px-4 backdrop-blur-xl sm:px-6">
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
            className="text-muted-foreground h-9 min-w-0 flex-1 justify-start gap-2 rounded-md border-border/80 bg-secondary/40 sm:w-64 sm:flex-none"
            onClick={() => setPaletteOpen(true)}
            aria-label="Open quick switcher"
          >
            <SearchIcon className="size-3.5" />
            <span className="hidden sm:inline">Quick switcher</span>
            <span className="sm:hidden">Go to…</span>
            <kbd className="bg-muted ml-auto rounded border border-border px-1.5 font-mono text-[10px]">⌘K</kbd>
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="min-h-[calc(100svh-3.5rem)] flex-1">
          <ContentFrame width="wide">{children}</ContentFrame>
        </main>
      </div>

      {paletteOpen ? (
        <Suspense fallback={null}>
          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </Suspense>
      ) : null}
    </div>
  );
}

function Sidebar({
  className,
  collapsed = false,
  onNavigate,
  onToggle,
}: {
  className?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggle?: () => void;
}) {
  const { pathname } = useLocation();
  const { user, hasCapability } = useSession();
  const profileActive = pathname === "/profile";
  const { resolvedTheme } = useTheme();

  return (
    <aside
      className={`bg-sidebar flex shrink-0 flex-col border-r transition-[width] duration-200 ${collapsed ? "w-[76px]" : "w-[260px]"} ${className ?? ""}`}
    >
      <div className={`flex border-b ${collapsed ? "h-20 flex-col justify-center gap-0.5 px-2" : "h-20 items-center gap-2 px-3"}`}>
        <Link to="/dashboard" className={`flex min-w-0 items-center font-semibold tracking-tight ${collapsed ? "justify-center" : "flex-1"}`}>
          <img
            src={collapsed ? logoUrl : resolvedTheme === "dark" ? darkLogoUrl : fullLogoUrl}
            alt="ACM Student Chapter"
            decoding="async"
            className={collapsed ? "size-9 object-contain" : "h-14 w-full object-contain object-left"}
          />
        </Link>
        {onToggle ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className={collapsed ? "size-6 self-center" : "size-8"}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            title={collapsed ? "Expand navigation" : "Collapse navigation"}
            onClick={onToggle}
          >
            {collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
          </Button>
        ) : null}
      </div>

      <nav className={collapsed ? "flex-1 overflow-y-auto p-2" : "flex-1 overflow-y-auto p-4"} aria-label="Primary">
        <div className="flex flex-col gap-6">
          {navigation.map((group) => {
            const items = group.items.filter(
              (item) =>
                !("capability" in item) || hasCapability(item.capability as Capability),
            );
            if (items.length === 0) return null;
            return (
              <div key={group.label}>
                {!collapsed ? (
                  <p className="text-muted-foreground mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em]">
                    {group.label}
                  </p>
                ) : null}
                <ul className="flex flex-col gap-0.5">
                  {items.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <li key={href}>
                        <Link
                          to={href}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          aria-label={collapsed ? label : undefined}
                          title={collapsed ? label : undefined}
                          className={`flex items-center rounded-lg border py-2 text-sm font-medium transition-colors ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${
                            active
                              ? "border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
                              : "border-transparent text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                          }`}
                        >
                          <Icon className="size-4 shrink-0" />
                          {!collapsed ? label : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      {user ? (
        <div className={collapsed ? "border-t p-2" : "border-t p-3"}>
          <Link
            to="/profile"
            onClick={onNavigate}
            aria-current={profileActive ? "page" : undefined}
            aria-label="Profile"
            title={collapsed ? "Profile" : undefined}
            className={`flex items-center rounded-lg p-2 transition-colors ${profileActive ? "bg-sidebar-accent text-sidebar-foreground" : "hover:bg-sidebar-accent/60"} ${collapsed ? "justify-center" : "gap-2.5"}`}
          >
            <UserAvatar name={user.username} className="size-8" />
            {!collapsed ? <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{user.username}</span>
              <span className="text-muted-foreground block truncate text-xs">
                {topRole(user.role_assignments.map((a) => a.role_code))}
              </span>
            </span> : null}
          </Link>
        </div>
      ) : null}
    </aside>
  );
}

function topRole(roles: string[]) {
  const order = ["SUPER_ADMIN", "ADMIN", "WEBMASTER", "SIG_LEAD", "SIG_CORE", "MEMBER"];
  const top = order.find((role) => roles.includes(role));
  return top ? roleLabel(top) : "Member";
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!user) return null;

  const signOut = (fn: typeof logout) =>
    fn()
      .catch(() => undefined)
      .finally(() => {
        queryClient.clear();
        navigate("/login", { replace: true });
      });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu">
          <SettingsIcon />
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
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <ChartPieIcon /> My profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/change-password")}>
          <SettingsIcon /> Change password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut(logout)}>
          <LogOutIcon /> Log out
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => signOut(logoutAll)}>
          <XIcon /> Log out everywhere
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
