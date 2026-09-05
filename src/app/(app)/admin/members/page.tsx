"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRoundIcon, ShieldUserIcon, UserMinusIcon, UserPlusIcon } from "lucide-react";

import {
  changeRoles,
  listAdminMembers,
  resetPassword,
  setMemberStatus,
  type AdminMember,
} from "@/lib/api/admin";
import { listSigs, type Sig } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/errors";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const roleCodes = ["MEMBER", "SIG_CORE", "SIG_LEAD", "WEBMASTER", "ADMIN", "SUPER_ADMIN"];

export default function AdminMembersPage() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const query = useQuery({
    queryKey: ["admin", "members", activeFilter],
    queryFn: () =>
      listAdminMembers({
        is_active: activeFilter === "all" ? undefined : activeFilter === "true",
      }),
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage account status, roles, and password resets.
          </p>
        </div>
        <div className="w-40">
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All members</SelectItem>
              <SelectItem value="true">Active only</SelectItem>
              <SelectItem value="false">Inactive only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <AsyncBoundary
        query={query}
        isEmpty={(members) => members.length === 0}
        empty={{ title: "No members match this filter" }}
      >
        {(members) => (
          <div className="bg-card rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <MemberRow key={member.id} member={member} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}

function MemberRow({ member }: { member: AdminMember }) {
  const queryClient = useQueryClient();
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [resetSecret, setResetSecret] = useState<string | null>(null);

  const status = useMutation({
    mutationFn: (isActive: boolean) => setMemberStatus(member.id, isActive),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success(`${updated.username} is now ${updated.is_active ? "active" : "inactive"}.`);
      setConfirmStatus(false);
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not update the status."),
  });

  const reset = useMutation({
    mutationFn: () => resetPassword(member.id),
    onSuccess: (result) => {
      setResetSecret(result.temporary_password);
      toast.success("Temporary password generated — share it once.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not reset the password."),
  });

  return (
    <TableRow>
      <TableCell>
        <p className="text-sm font-medium">{member.username}</p>
        <p className="text-muted-foreground font-mono text-xs">{member.roll_number}</p>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {member.role_assignments.length === 0 ? (
            <span className="text-muted-foreground text-sm">Member</span>
          ) : (
            member.role_assignments.map((assignment, index) => (
              <Badge key={index} variant="secondary">
                {assignment.role_code}
                {assignment.sig_id ? ` · SIG ${assignment.sig_id}` : ""}
              </Badge>
            ))
          )}
        </div>
      </TableCell>
      <TableCell>
        <Switch
          checked={member.is_active}
          onCheckedChange={() => setConfirmStatus(true)}
          aria-label={`Toggle active state for ${member.username}`}
        />
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.username}`}>
              <ShieldUserIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => reset.mutate()}>
              <KeyRoundIcon /> Reset password
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRolesOpen(true)}>
              <ShieldUserIcon /> Manage roles
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      <Dialog open={confirmStatus} onOpenChange={setConfirmStatus}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {member.is_active ? "Deactivate" : "Activate"} {member.username}?
            </DialogTitle>
            <DialogDescription>
              {member.is_active
                ? "Deactivated members cannot sign in."
                : "The member will be able to sign in again."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmStatus(false)}>
              Cancel
            </Button>
            <Button
              variant={member.is_active ? "destructive" : "default"}
              onClick={() => status.mutate(!member.is_active)}
              disabled={status.isPending}
            >
              {member.is_active ? <UserMinusIcon /> : <UserPlusIcon />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TemporaryPasswordDialog
        username={member.username}
        password={resetSecret}
        onClose={() => setResetSecret(null)}
      />

      <RoleDialog
        open={rolesOpen}
        member={member}
        onOpenChange={setRolesOpen}
      />
    </TableRow>
  );
}

export function TemporaryPasswordDialog({
  username,
  password,
  onClose,
}: {
  username: string;
  password: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={password !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>One-time password for {username}</DialogTitle>
          <DialogDescription>
            Copy it now — it is shown only this once and expires in 24 hours.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted flex items-center justify-between gap-3 rounded-lg p-3">
          <code className="text-sm font-semibold break-all">{password}</code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard.writeText(password ?? "")}
          >
            Copy
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RoleDialog({
  open,
  member,
  onOpenChange,
}: {
  open: boolean;
  member: AdminMember;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<"assign" | "revoke">("assign");
  const [roleCode, setRoleCode] = useState("MEMBER");
  const [sigId, setSigId] = useState<string>("none");

  const sigsQuery = useQuery({
    queryKey: ["sigs"],
    queryFn: () => listSigs(),
    enabled: open,
  });
  const needsSig = ["SIG_CORE", "SIG_LEAD"].includes(roleCode);

  const save = useMutation({
    mutationFn: () =>
      changeRoles(member.id, {
        action,
        role_code: roleCode,
        sig_id: needsSig && sigId !== "none" ? Number(sigId) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success("Roles updated.");
      onOpenChange(false);
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not update the roles."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage roles for {member.username}</DialogTitle>
          <DialogDescription>
            Assignments take effect on the member&apos;s next sign-in.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            {(["assign", "revoke"] as const).map((option) => (
              <Button
                key={option}
                type="button"
                variant={action === option ? "default" : "outline"}
                onClick={() => setAction(option)}
                className="capitalize"
              >
                {option}
              </Button>
            ))}
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Role
            <Select value={roleCode} onValueChange={setRoleCode}>
              <SelectTrigger aria-label="Role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleCodes.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          {needsSig ? (
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              SIG
              <Select value={sigId} onValueChange={setSigId}>
                <SelectTrigger aria-label="SIG">
                  <SelectValue placeholder="Choose a SIG" />
                </SelectTrigger>
                <SelectContent>
                  {(sigsQuery.data ?? []).map((sig: Sig) => (
                    <SelectItem key={sig.id} value={String(sig.id)}>
                      {sig.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || (needsSig && sigId === "none")}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
