import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDownIcon, LayersIcon, PencilIcon, PlusIcon } from "lucide-react";
import { z } from "zod";

import {
  changeRoles,
  createSig,
  listAdminMembers,
  listSigs,
  updateSig,
  type AdminMember,
  type Sig,
} from "@/lib/api/admin";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/errors";
import { parseForm } from "@/lib/form-validation";
import { slugify } from "@/lib/formatters/slug";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminShell } from "@/components/admin/admin-shell";

const sigSchema = z.object({
  name: z.string().min(1, "Enter a SIG name."),
});

export function buildSigCreateInput(name: string) {
  return { name, slug: slugify(name) };
}

type SigRoleChange = {
  action: "assign" | "revoke";
  role_code: "SIG_LEAD" | "SIG_CORE";
  sig_id: number;
  userId: number;
};

export function buildSigRoleChanges(
  members: AdminMember[],
  sigId: number,
  leadId: number | null,
  coLeadId: number | null,
): SigRoleChange[] {
  return ([
    ["SIG_LEAD", leadId],
    ["SIG_CORE", coLeadId],
  ] as const).flatMap(([role_code, desiredId]) => {
    const currentId = members.find((member) =>
      member.role_assignments.some(
        (assignment) => assignment.role_code === role_code && assignment.sig_id === sigId,
      ),
    )?.id ?? null;
    const changes: SigRoleChange[] = [];
    if (currentId !== desiredId) {
      if (currentId !== null) changes.push({ action: "revoke", role_code, sig_id: sigId, userId: currentId });
      if (desiredId !== null) changes.push({ action: "assign", role_code, sig_id: sigId, userId: desiredId });
    }
    return changes;
  });
}

export function getSigLeadership(sigId: number, members: AdminMember[]) {
  const findName = (roleCode: "SIG_LEAD" | "SIG_CORE") => members.find((member) =>
    member.role_assignments.some(
      (assignment) => assignment.role_code === roleCode && assignment.sig_id === sigId,
    ),
  )?.username ?? null;
  return { lead: findName("SIG_LEAD"), coLead: findName("SIG_CORE") };
}

export default function AdminSigsPage() {
  useDocumentTitle("SIGs");
  const [editing, setEditing] = useState<Sig | null>(null);
  const [creating, setCreating] = useState(false);
  const query = useQuery({ queryKey: queryKeys.sigs.list(), queryFn: ({ signal }) => listSigs(undefined, signal) });
  const membersQuery = useQuery({
    queryKey: queryKeys.admin.members,
    queryFn: ({ signal }) => listAdminMembers({ limit: 100, is_active: true }, signal),
  });

  return (
    <AdminShell>
      <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
        <PageHeader
          title="SIGs"
          description="Control group access and content scope."
          meta={
            query.data ? (
              <>
                <Badge variant="outline">{query.data.length} total</Badge>
                <Badge variant="success">
                  {query.data.filter((sig) => sig.is_active).length} active
                </Badge>
              </>
            ) : null
          }
          actions={<Button onClick={() => setCreating(true)}><PlusIcon /> New SIG</Button>}
        />

      <AsyncBoundary
        query={query}
        isEmpty={(sigs) => sigs.length === 0}
        empty={{
          title: "No SIGs yet",
          description: "Create the first special interest group to scope content.",
        }}
      >
        {(sigs) => (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sigs.map((sig) => {
              const leadership = getSigLeadership(sig.id, membersQuery.data ?? []);
              return (
                <li
                  key={sig.id}
                  className="bg-card flex min-h-56 flex-col rounded-xl border p-5 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-lg">
                      <LayersIcon className="size-5" />
                    </div>
                    <StatusBadge status={sig.is_active ? "ACTIVE" : "INACTIVE"} />
                  </div>
                  <div className="mt-5 min-w-0">
                    <h2 className="text-lg leading-6 font-semibold [overflow-wrap:anywhere]">{sig.name}</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Special interest group</p>
                  </div>
                  <dl className="mt-5 grid flex-1 gap-2 border-t pt-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-muted-foreground">Lead</dt>
                      <dd className="truncate font-medium">{leadership.lead ?? "Unassigned"}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-muted-foreground">Co-lead</dt>
                      <dd className="truncate font-medium">{leadership.coLead ?? "Unassigned"}</dd>
                    </div>
                  </dl>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-5 w-full"
                    aria-label={`Edit ${sig.name}`}
                    onClick={() => setEditing(sig)}
                  >
                    <PencilIcon /> Edit SIG
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </AsyncBoundary>

      <SigDialog
        key={editing?.id ?? "new"}
        open={creating || editing !== null}
        sig={editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        />
      </div>
    </AdminShell>
  );
}

function SigDialog({
  open,
  sig,
  onOpenChange,
}: {
  open: boolean;
  sig: Sig | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(sig?.name ?? "");
  const [isActive, setIsActive] = useState(sig?.is_active ?? true);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [coLeadId, setCoLeadId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const membersQuery = useQuery({
    queryKey: queryKeys.admin.members,
    queryFn: ({ signal }) => listAdminMembers({ limit: 100, is_active: true }, signal),
    enabled: open,
  });
  const currentRoles = useMemo(() => {
    const members = membersQuery.data ?? [];
    return {
      leadId: sig
        ? members.find((member) => member.role_assignments.some(
            (assignment) => assignment.role_code === "SIG_LEAD" && assignment.sig_id === sig.id,
          ))?.id ?? null
        : null,
      coLeadId: sig
        ? members.find((member) => member.role_assignments.some(
            (assignment) => assignment.role_code === "SIG_CORE" && assignment.sig_id === sig.id,
          ))?.id ?? null
        : null,
    };
  }, [membersQuery.data, sig]);
  const selectedLeadId = leadId ?? (currentRoles.leadId === null ? "" : String(currentRoles.leadId));
  const selectedCoLeadId = coLeadId ?? (currentRoles.coLeadId === null ? "" : String(currentRoles.coLeadId));

  const save = useMutation({
    mutationFn: async () => {
      setFormErrors({});
      const values = parseForm(sigSchema, { name }, (_field, message) =>
        setFormErrors((current) => ({ ...current, [_field]: message })),
      );
      if (!values) throw new Error("Please fix the errors above.");
      if (membersQuery.isPending || membersQuery.isError) {
        throw new Error("Member list is not ready yet.");
      }
      const savedSig = sig
        ? await updateSig(sig.id, { name: values.name, is_active: isActive })
        : await createSig(buildSigCreateInput(values.name));
      await Promise.all(
        buildSigRoleChanges(
          membersQuery.data ?? [],
          savedSig.id,
          selectedLeadId ? Number(selectedLeadId) : null,
          selectedCoLeadId ? Number(selectedCoLeadId) : null,
        ).map(({ userId, action, role_code, sig_id }) =>
          changeRoles(userId, { action, role_code, sig_id }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sigs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.members });
      toast.success(sig ? "SIG updated." : "SIG created.");
      onOpenChange(false);
    },
    onError: (error) => {
      setFormErrors({
        form: error instanceof ApiError ? error.message : "Could not save this SIG.",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-md gap-0 overflow-y-auto p-0">
        <DialogHeader className="border-b px-6 pt-6 pb-5 pr-14">
          <DialogTitle className="leading-snug [overflow-wrap:anywhere]">{sig ? `Edit ${sig.name}` : "Create a SIG"}</DialogTitle>
          <DialogDescription>
            {sig
              ? "Update the group details or its availability."
              : "Create a group for scoped access and content."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (selectedLeadId && selectedLeadId === selectedCoLeadId) {
              setFormErrors({ roles: "Choose different members for lead and co-lead." });
              return;
            }
            save.mutate();
          }}
          noValidate
        >
          {formErrors.form ? <p role="alert" className="text-destructive text-sm font-medium">{formErrors.form}</p> : null}
          <Field label="Name" htmlFor="sig-name" error={formErrors.name}>
            <Input
              id="sig-name"
              value={name}
              aria-invalid={Boolean(formErrors.name)}
              onChange={(event) => {
                setName(event.target.value);
              }}
              placeholder="e.g. Web Development"
            />
          </Field>
          {sig ? (
            <label className="flex items-center justify-between gap-4 border-y py-4 text-sm">
              <span>
                <span className="block font-medium">Active</span>
                <span className="text-muted-foreground mt-1 block text-xs">
                  Turn this off when the group should no longer be used.
                </span>
              </span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </label>
          ) : null}
          <div className="flex flex-col gap-4 border-t pt-5">
            <div>
              <h3 className="text-sm font-medium">SIG leadership</h3>
              <p className="text-muted-foreground mt-1 text-xs">
                Assign the lead and co-lead while creating or editing this SIG.
              </p>
            </div>
            <MemberPicker
              label="Lead"
              value={selectedLeadId}
              members={membersQuery.data ?? []}
              onChange={setLeadId}
              disabled={membersQuery.isPending || membersQuery.isError}
            />
            <MemberPicker
              label="Co-lead"
              value={selectedCoLeadId}
              members={membersQuery.data ?? []}
              excludeId={selectedLeadId}
              onChange={setCoLeadId}
              error={formErrors.roles}
              disabled={membersQuery.isPending || membersQuery.isError}
            />
            {membersQuery.isError ? <p role="alert" className="text-destructive text-xs">Could not load active members.</p> : null}
          </div>
          <DialogFooter className="border-t pt-5">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending || membersQuery.isPending || membersQuery.isError}>
              {save.isPending ? "Saving…" : sig ? "Save changes" : "Create SIG"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MemberPicker({
  label,
  value,
  members,
  onChange,
  excludeId,
  error,
  disabled,
}: {
  label: string;
  value: string;
  members: AdminMember[];
  onChange: (value: string) => void;
  excludeId?: string;
  error?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = members.find((member) => String(member.id) === value);
  const options = members.filter((member) => {
    if (excludeId && String(member.id) === excludeId && String(member.id) !== value) return false;
    const query = search.trim().toLowerCase();
    return !query || `${member.username} ${member.roll_number}`.toLowerCase().includes(query);
  });
  const emptyLabel = `No ${label.toLowerCase()} assigned`;

  return (
    <Field label={label} htmlFor={`sig-${label.toLowerCase().replace("-", "")}`} error={error}>
      <div className="relative">
        <button
          type="button"
          className="border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-sm outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={label}
          disabled={disabled}
          onClick={() => {
            setOpen((current) => !current);
            setSearch("");
          }}
        >
          <span className={selected ? "truncate" : "text-muted-foreground truncate"}>
            {selected ? `${selected.username} · ${selected.roll_number}` : emptyLabel}
          </span>
          <ChevronDownIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </button>
        {open ? (
          <div
            className="bg-popover text-popover-foreground absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border shadow-md"
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
          >
            <div className="border-b p-2">
              <Input
                autoFocus
                aria-label={`Search ${label.toLowerCase()} members`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search username or roll number"
              />
            </div>
            <div role="listbox" aria-label={`${label} members`} className="max-h-52 overflow-y-auto p-1">
              <button
                type="button"
                role="option"
                aria-selected={!value}
                className="hover:bg-accent w-full rounded-md px-3 py-2 text-left text-sm"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                {emptyLabel}
              </button>
              {options.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  role="option"
                  aria-selected={String(member.id) === value}
                  className="hover:bg-accent w-full rounded-md px-3 py-2 text-left text-sm"
                  onClick={() => {
                    onChange(String(member.id));
                    setOpen(false);
                  }}
                >
                  <span className="block truncate">{member.username}</span>
                  <span className="text-muted-foreground block text-xs">{member.roll_number}</span>
                </button>
              ))}
              {options.length === 0 ? <p className="text-muted-foreground px-3 py-3 text-center text-sm">No matching members.</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    </Field>
  );
}
