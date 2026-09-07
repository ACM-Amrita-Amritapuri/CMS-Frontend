"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlusIcon, UsersIcon } from "lucide-react";
import { z } from "zod";

import {
  applyToCycle,
  createCycle,
  listCycles,
  transitionCycle,
  type RecruitmentCycle,
} from "@/lib/api/club-operations";
import { listSigs } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/errors";
import { localInputToIso } from "@/lib/formatters/date";
import { formatDateTime } from "@/lib/formatters/date";
import { parseForm } from "@/lib/form-validation";
import { useSession } from "@/app/providers";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const cycleSchema = z.object({
  title: z.string().min(1, "Enter a title."),
  opens_at: z.string().min(1, "Pick an opening time."),
  closes_at: z.string().min(1, "Pick a closing time."),
});

export default function RecruitmentPage() {
  const [creating, setCreating] = useState(false);
  const query = useQuery({ queryKey: ["recruitment", "cycles"], queryFn: listCycles });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recruitment</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Recruitment cycles: apply while a cycle is open.
          </p>
        </div>
        <CreateCycleButton open={creating} onOpenChange={setCreating} />
      </header>

      <AsyncBoundary
        query={query}
        isEmpty={(cycles) => cycles.length === 0}
        empty={{ icon: UsersIcon, title: "No recruitment cycles yet" }}
      >
        {(cycles) => (
          <ul className="flex flex-col gap-4">
            {cycles.map((cycle) => (
              <CycleCard key={cycle.id} cycle={cycle} />
            ))}
          </ul>
        )}
      </AsyncBoundary>
    </div>
  );
}

function CycleCard({ cycle }: { cycle: RecruitmentCycle }) {
  const { hasCapability } = useSession();
  const manage = hasCapability("manage_operations");
  const queryClient = useQueryClient();
  const [applying, setApplying] = useState(false);
  const [statement, setStatement] = useState("");
  const [preferredSig, setPreferredSig] = useState("none");

  const sigs = useQuery({ queryKey: ["sigs"], queryFn: () => listSigs() });

  const transition = useMutation({
    mutationFn: () => transitionCycle(cycle.id, cycle.state === "DRAFT" ? "open" : "close"),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["recruitment"] });
      toast.success(`Cycle is now ${result.state.toLowerCase()}.`);
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not update the cycle."),
  });

  const apply = useMutation({
    mutationFn: () =>
      applyToCycle(cycle.id, {
        statement,
        preferred_sig_id: preferredSig === "none" ? null : Number(preferredSig),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment"] });
      setApplying(false);
      toast.success("Application submitted.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not apply."),
  });

  const isOpen = cycle.state === "OPEN";

  return (
    <li className="bg-card rounded-xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{cycle.title}</h2>
          {cycle.description ? (
            <p className="text-muted-foreground mt-1 text-sm">{cycle.description}</p>
          ) : null}
          <p className="text-muted-foreground mt-2 text-xs">
            {formatDateTime(cycle.opens_at)} → {formatDateTime(cycle.closes_at)}
          </p>
        </div>
        <Badge
          variant={cycle.state === "OPEN" ? "success" : cycle.state === "DRAFT" ? "warning" : "secondary"}
        >
          {cycle.state.toLowerCase()}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isOpen ? (
          applying ? (
            <div className="flex w-full flex-col gap-3 rounded-lg border p-4">
              <Field label="Why do you want to join?" htmlFor={`st-${cycle.id}`}>
                <Textarea
                  id={`st-${cycle.id}`}
                  rows={3}
                  value={statement}
                  onChange={(event) => setStatement(event.target.value)}
                  required
                />
              </Field>
              <Field label="Preferred SIG (optional)" htmlFor={`sig-${cycle.id}`} className="max-w-xs">
                <select
                  id={`sig-${cycle.id}`}
                  value={preferredSig}
                  onChange={(event) => setPreferredSig(event.target.value)}
                  className="border-input h-9 w-full rounded-lg border bg-transparent px-3 text-sm"
                >
                  <option value="none">No preference</option>
                  {(sigs.data ?? []).map((sig) => (
                    <option key={sig.id} value={String(sig.id)}>
                      {sig.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex gap-2">
                <Button
                  onClick={() => apply.mutate()}
                  disabled={apply.isPending || !statement.trim()}
                >
                  <UserPlusIcon /> Submit application
                </Button>
                <Button variant="ghost" onClick={() => setApplying(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" onClick={() => setApplying(true)}>
              <UserPlusIcon /> Apply
            </Button>
          )
        ) : null}
        {manage ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => transition.mutate()}
            disabled={transition.isPending || cycle.state === "CLOSED"}
          >
            {cycle.state === "DRAFT" ? "Open cycle" : cycle.state === "OPEN" ? "Close cycle" : "Closed"}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function CreateCycleButton({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { hasCapability } = useSession();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      setFormError(null);
      const values = parseForm(
        cycleSchema,
        { title, opens_at: opensAt, closes_at: closesAt },
        (_field, message) => setFormError(message),
      );
      if (!values) return null;
      const opens = localInputToIso(values.opens_at);
      const closes = localInputToIso(values.closes_at);
      if (!opens || !closes || opens >= closes) {
        setFormError("The closing time must be after the opening time.");
        return null;
      }
      return createCycle({
        title: values.title,
        description: description.trim() || undefined,
        opens_at: opens,
        closes_at: closes,
      });
    },
    onSuccess: (cycle) => {
      if (!cycle) return;
      queryClient.invalidateQueries({ queryKey: ["recruitment"] });
      toast.success("Cycle created as a draft.");
      onOpenChange(false);
    },
    onError: (error) =>
      setFormError(error instanceof ApiError ? error.message : "Could not create the cycle."),
  });

  if (!hasCapability("manage_operations")) return null;

  return (
    <>
      <Button onClick={() => onOpenChange(true)}>New cycle</Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New recruitment cycle</DialogTitle>
            <DialogDescription>Drafts stay hidden until you open the cycle.</DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate();
            }}
            noValidate
          >
            <Field label="Title" htmlFor="cy-title" error={formError ?? undefined}>
              <Input id="cy-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Fall 2026 recruitment" />
            </Field>
            <Field label="Description" htmlFor="cy-description">
              <Textarea id="cy-description" rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Opens" htmlFor="cy-opens">
                <Input id="cy-opens" type="datetime-local" value={opensAt} onChange={(event) => setOpensAt(event.target.value)} />
              </Field>
              <Field label="Closes" htmlFor="cy-closes">
                <Input id="cy-closes" type="datetime-local" value={closesAt} onChange={(event) => setClosesAt(event.target.value)} />
              </Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                Create cycle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
