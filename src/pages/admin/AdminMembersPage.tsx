import { useEffect, useState, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2Icon,
  KeyRoundIcon,
  SearchIcon,
  ShieldUserIcon,
  XIcon,
} from "lucide-react";

import {
  changeRoles,
  listAdminMembers,
  resetPassword,
  setMemberStatus,
  type AdminMember,
} from "@/lib/api/admin";
import { listSigs, type Sig } from "@/lib/api/admin";
import { ROLE_CODES } from "@/lib/api/types";
import { roleLabel, roleLabels } from "@/lib/auth/permissions";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/errors";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminShell } from "@/components/admin/admin-shell";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;
const MOBILE_QUERY = "(max-width: 1023px)";

function useMobileLayout() {
  return useSyncExternalStore(
    subscribeToMobileLayout,
    getMobileLayout,
    () => false,
  );
}

function subscribeToMobileLayout(notify: () => void) {
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

function getMobileLayout() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

export default function AdminMembersPage() {
  useDocumentTitle("Members");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sigFilter, setSigFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const mobileLayout = useMobileLayout();
  const normalizedSearch = searchFilter.trim();
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchFilter(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  const query = useQuery({
    queryKey: queryKeys.admin.memberList(activeFilter, sigFilter, normalizedSearch, PAGE_SIZE, offset),
    queryFn: ({ signal }) =>
      listAdminMembers({
        limit: PAGE_SIZE,
        offset,
        is_active: activeFilter === "all" ? undefined : activeFilter === "true",
        search: normalizedSearch || undefined,
        sig_id: sigFilter === "all" ? undefined : Number(sigFilter),
      }, signal),
  });
  const sigsQuery = useQuery({
    queryKey: queryKeys.sigs.list(),
    queryFn: ({ signal }) => listSigs(undefined, signal),
  });

  return (
    <AdminShell>
      <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
      <PageHeader
        title="Members"
        description="Manage account status, roles, and password resets."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <NativeSelect
              aria-label="Filter by status"
              value={activeFilter}
              onChange={(event) => { setActiveFilter(event.target.value); setOffset(0); }}
              className="w-full sm:w-44"
            >
              <option value="all">All members</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </NativeSelect>
            <NativeSelect
              aria-label="Filter by SIG"
              value={sigFilter}
              onChange={(event) => { setSigFilter(event.target.value); setOffset(0); }}
              className="w-full sm:w-44"
            >
              <option value="all">All SIGs</option>
              {(sigsQuery.data ?? []).map((sig) => (
                <option key={sig.id} value={sig.id}>
                  {sig.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        }
      />

      <AsyncBoundary
        query={query}
        isEmpty={() => false}
        empty={{
          title: "No members match these filters",
          description: "Try changing the status or SIG filter above.",
        }}
      >
        {(page) => {
          const members = page.members;
          return (
            <>
              <div className="flex flex-col gap-3 border-y py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 sm:max-w-xl">
                  <SearchIcon aria-hidden className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    type="search"
                    aria-label="Search members"
                    placeholder="Search by username, roll number, or role"
                    value={search}
                    onChange={(event) => { setSearch(event.target.value); setOffset(0); }}
                    className="h-9 pl-9 pr-9"
                  />
                  {search ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Clear member search"
                      className="text-muted-foreground absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => setSearch("")}
                    >
                      <XIcon />
                    </Button>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-sm" aria-live="polite">
                  {page.total} {page.total === 1 ? "member" : "members"}
                </p>
              </div>
              {members.length === 0 ? (
                <div role="status" className="border-y border-dashed py-12 text-center">
                  <p className="text-sm font-medium">No members match these filters</p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="mt-1"
                    onClick={() => {
                      setSearch("");
                      setActiveFilter("all");
                      setSigFilter("all");
                      setOffset(0);
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : null}
              {members.length > 0 && !mobileLayout ? (
               <Table className="min-w-[48rem]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-52 text-right"><span>Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <MemberRow key={member.id} member={member} sigs={sigsQuery.data ?? []} />
                  ))}
                </TableBody>
              </Table>
              ) : null}
              {members.length > 0 && mobileLayout ? <ul className="grid min-w-0 gap-3">
              {members.map((member) => (
                <MemberCard key={member.id} member={member} sigs={sigsQuery.data ?? []} />
              ))}
              </ul> : null}
              <PaginationControls
                label="Members"
                offset={page.offset}
                limit={page.limit}
                total={page.total}
                onPageChange={setOffset}
              />
            </>
          );
        }}
      </AsyncBoundary>
      </div>
    </AdminShell>
  );
}

function MemberRow({ member, sigs }: { member: AdminMember; sigs: Sig[] }) {
  const queryClient = useQueryClient();
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [resetSecret, setResetSecret] = useState<string | null>(null);

  const status = useMutation({
    mutationFn: (isActive: boolean) => setMemberStatus(member.id, isActive),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.members });
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
        <p className="max-w-64 text-sm font-medium wrap-anywhere">{member.username}</p>
        <p className="text-muted-foreground mt-1 font-mono text-xs wrap-anywhere">{member.roll_number}</p>
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
        <div className="flex items-center gap-3">
          <StatusBadge status={member.is_active ? "ACTIVE" : "INACTIVE"} />
          <Switch
            checked={member.is_active}
            onCheckedChange={() => setConfirmStatus(true)}
            aria-label={`Toggle active state for ${member.username}`}
          />
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => reset.mutate()} disabled={reset.isPending}>
            <KeyRoundIcon /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRolesOpen(true)}>
            <ShieldUserIcon /> Roles
          </Button>
        </div>
      </TableCell>

      <ConfirmDialog
        open={confirmStatus}
        onOpenChange={setConfirmStatus}
        title={`${member.is_active ? "Deactivate" : "Activate"} ${member.username}?`}
        description={
          member.is_active
            ? "Deactivated members cannot sign in."
            : "The member will be able to sign in again."
        }
        confirmLabel="Confirm"
        variant={member.is_active ? "destructive" : "default"}
        pending={status.isPending}
        onConfirm={() => status.mutate(!member.is_active)}
      />

      <TemporaryPasswordDialog
        username={member.username}
        password={resetSecret}
        onClose={() => setResetSecret(null)}
      />

      <RoleDialog
        open={rolesOpen}
        member={member}
        sigs={sigs}
        onOpenChange={setRolesOpen}
      />
    </TableRow>
  );
}

function MemberCard({ member, sigs }: { member: AdminMember; sigs: Sig[] }) {
  const queryClient = useQueryClient();
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [resetSecret, setResetSecret] = useState<string | null>(null);

  const status = useMutation({
    mutationFn: (isActive: boolean) => setMemberStatus(member.id, isActive),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.members });
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
    <li className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{member.username}</p>
          <p className="text-muted-foreground mt-1 font-mono text-xs wrap-anywhere">{member.roll_number}</p>
        </div>
        <StatusBadge status={member.is_active ? "ACTIVE" : "INACTIVE"} />
      </div>
      <div className="flex flex-wrap gap-1" aria-label={`Roles for ${member.username}`}>
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
      <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={member.is_active}
            onCheckedChange={() => setConfirmStatus(true)}
            aria-label={`Toggle active state for ${member.username}`}
          />
          <span className="text-muted-foreground text-xs">
            {member.is_active ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 [&>button]:flex-1 sm:[&>button]:flex-none">
          <Button variant="outline" size="sm" onClick={() => reset.mutate()} disabled={reset.isPending}>
            <KeyRoundIcon /> Reset password
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRolesOpen(true)}>
            <ShieldUserIcon /> Roles
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmStatus}
        onOpenChange={setConfirmStatus}
        title={`${member.is_active ? "Deactivate" : "Activate"} ${member.username}?`}
        description={
          member.is_active
            ? "Deactivated members cannot sign in."
            : "The member will be able to sign in again."
        }
        confirmLabel="Confirm"
        variant={member.is_active ? "destructive" : "default"}
        pending={status.isPending}
        onConfirm={() => status.mutate(!member.is_active)}
      />
      <TemporaryPasswordDialog
        username={member.username}
        password={resetSecret}
        onClose={() => setResetSecret(null)}
      />
      <RoleDialog open={rolesOpen} member={member} sigs={sigs} onOpenChange={setRolesOpen} />
    </li>
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
          <DialogTitle className="pr-6 leading-snug wrap-anywhere">One-time password for {username}</DialogTitle>
          <DialogDescription>
            Copy it now — it is shown only this once and expires in 24 hours.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted flex items-center justify-between gap-3 rounded-lg p-3">
          <code className="min-w-0 flex-1 text-sm leading-6 font-semibold break-all">{password}</code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(password ?? "");
                toast.success("Password copied", {
                  description: "It’s ready to paste.",
                });
              } catch {
                toast.error("Couldn’t copy the password", {
                  description: "Please select it and copy it manually.",
                });
              }
            }}
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
  sigs,
  onOpenChange,
}: {
  open: boolean;
  member: AdminMember;
  sigs: Sig[];
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<"assign" | "revoke">("assign");
  const [roleCode, setRoleCode] = useState("MEMBER");
  const [sigId, setSigId] = useState<string>("none");
  const [revokeKey, setRevokeKey] = useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setAction("assign");
      setRoleCode("MEMBER");
      setSigId("none");
      setRevokeKey("");
    }
    onOpenChange(nextOpen);
  };

  const needsSig = ["SIG_CORE", "SIG_LEAD"].includes(roleCode);
  const selectedAssignment = member.role_assignments.find(
    (assignment) => `${assignment.role_code}:${assignment.sig_id ?? "none"}` === revokeKey,
  );
  const selectedAssignSigId = needsSig && sigId !== "none" ? Number(sigId) : null;
  const alreadyAssigned = member.role_assignments.some(
    (assignment) =>
      assignment.role_code === roleCode && assignment.sig_id === selectedAssignSigId,
  );
  const canApply = action === "assign"
    ? (!needsSig || sigId !== "none") && !alreadyAssigned
    : Boolean(selectedAssignment);

  const save = useMutation({
    mutationFn: () => {
      if (action === "revoke") {
        if (!selectedAssignment) {
          throw new Error("Select a role to revoke.");
        }
        return changeRoles(member.id, {
          action,
          role_code: selectedAssignment.role_code,
          sig_id: selectedAssignment.sig_id,
        });
      }
      return changeRoles(member.id, {
        action,
        role_code: roleCode,
        sig_id: needsSig && sigId !== "none" ? Number(sigId) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.members });
      toast.success("Roles updated.");
      handleOpenChange(false);
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not update the roles."),
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-lg gap-0 overflow-y-auto p-0">
        <DialogHeader className="border-b px-6 pt-6 pb-5 pr-14">
          <DialogTitle className="leading-snug wrap-anywhere">Manage roles for {member.username}</DialogTitle>
          <DialogDescription>
            Add or remove access for this account. Changes take effect on the next sign-in.
          </DialogDescription>
        </DialogHeader>
        <div role="group" aria-label="Role action" className="flex border-b px-6">
            {(["assign", "revoke"] as const).map((option) => (
              <Button
                key={option}
                type="button"
                variant="ghost"
                aria-pressed={action === option}
                onClick={() => {
                  setAction(option);
                  setRevokeKey("");
                }}
                className={cn(
                  "h-11 flex-1 rounded-none border-b-2 border-transparent px-4 text-sm",
                  action === option
                    ? "border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option === "assign" ? "Assign role" : "Revoke role"}
              </Button>
            ))}
          </div>
        <div className="flex flex-col gap-5 p-6">
          <p className="text-muted-foreground text-sm">
            {action === "assign"
              ? "Choose the access level to give this member."
              : "Choose one of this member's current assignments to remove."}
          </p>
          {action === "assign" ? (
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Role
                <Select value={roleCode} onValueChange={setRoleCode}>
                  <SelectTrigger aria-label="Role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_CODES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {roleLabels[code]}
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
                      {sigs.map((sig) => (
                        <SelectItem key={sig.id} value={String(sig.id)}>
                          {sig.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              ) : null}
              <p className="text-muted-foreground text-xs">
                {alreadyAssigned
                  ? "This role is already assigned to the member."
                  : needsSig
                    ? "SIG roles apply only to the selected group."
                    : "This role applies across the entire club."}
              </p>
            </div>
          ) : member.role_assignments.length > 0 ? (
            <div role="group" aria-label="Current role assignments" className="flex flex-col gap-2">
              {member.role_assignments.map((assignment) => {
                const key = `${assignment.role_code}:${assignment.sig_id ?? "none"}`;
                const isSelected = key === revokeKey;
                const sigName = sigs.find((sig) => sig.id === assignment.sig_id)?.name;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setRevokeKey(key)}
                    className={cn(
                      "flex w-full items-center justify-between gap-4 rounded-lg border p-3 text-left transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {roleLabel(assignment.role_code)}
                      </span>
                      <span className="text-muted-foreground mt-1 block text-xs">
                        {assignment.sig_id !== null
                          ? sigName ?? `SIG ${assignment.sig_id}`
                          : "Club-wide access"}
                      </span>
                    </span>
                    <CheckCircle2Icon
                      aria-hidden
                      className={cn(
                        "size-5 shrink-0",
                        isSelected ? "text-primary" : "text-muted-foreground/40",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="border border-dashed p-4 text-sm">
              This member has no assigned roles to revoke.
            </p>
          )}
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={action === "revoke" ? "destructive" : "default"}
            onClick={() => save.mutate()}
            disabled={save.isPending || !canApply}
          >
            {save.isPending ? "Saving…" : action === "assign" ? "Assign role" : "Revoke role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
