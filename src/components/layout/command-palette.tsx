import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  FolderKanbanIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  MoonIcon,
  SunIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";

import { useSession } from "@/app/providers";
import { useTheme } from "@/components/theme";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const destinations = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboardIcon },
  { href: "/hackathons", label: "Events", icon: TrophyIcon },
  { href: "/learning", label: "Learning", icon: GraduationCapIcon },
  { href: "/documentation", label: "Knowledge", icon: BookOpenIcon },
  { href: "/projects", label: "Projects", icon: FolderKanbanIcon },
  { href: "/members", label: "Members", icon: UsersIcon },
  { href: "/operations", label: "Operations", icon: CalendarDaysIcon, capability: "manage_operations" as const },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { hasCapability } = useSession();

  const go = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-lg translate-y-0 gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Quick switcher</DialogTitle>
        <Command label="Quick switcher" className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium">
          <Command.Input
            autoFocus
            placeholder="Go to…"
            className="placeholder:text-muted-foreground h-12 w-full border-b bg-transparent px-4 text-sm outline-none"
          />
          <Command.List className="max-h-72 overflow-y-auto p-1">
            <Command.Empty className="text-muted-foreground py-6 text-center text-sm">
              No results.
            </Command.Empty>
            <Command.Group heading="Go to">
              {destinations
                .filter((item) => !item.capability || hasCapability(item.capability))
                .map(({ href, label, icon: Icon }) => (
                  <Item key={href} onSelect={() => go(href)}>
                    <Icon className="size-4" /> {label}
                  </Item>
                ))}
            </Command.Group>
            <Command.Group heading="Theme">
              <Item onSelect={() => { onOpenChange(false); setTheme("light"); }}>
                <SunIcon className="size-4" /> Light
              </Item>
              <Item onSelect={() => { onOpenChange(false); setTheme("dark"); }}>
                <MoonIcon className="size-4" /> Dark
              </Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function Item({
  children,
  onSelect,
}: {
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm outline-none"
    >
      {children}
    </Command.Item>
  );
}
