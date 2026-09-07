"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2Icon, FolderKanbanIcon, PlusIcon, XCircleIcon } from "lucide-react";
import { z } from "zod";

import {
  createProposal,
  listProjects,
  listProposals,
  reviewProposal,
  submitProposal,
} from "@/lib/api/projects";
import { listSigs } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/errors";
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
import { Progress } from "@/components/ui/primitives";

const proposalSchema = z.object({
  title: z.string().min(1, "Enter a title."),
  summary: z.string().min(1, "Write a short summary."),
  description: z.string().min(1, "Describe the project."),
  team_capacity: z.coerce.number().int().min(1, "Capacity is 1–100.").max(100, "Capacity is 1–100."),
});

export default function ProjectsPage() {
  const { hasCapability } = useSession();
  const [proposing, setProposing] = useState(false);

  const projectsQuery = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });
  const proposalsQuery = useQuery({
    queryKey: ["proposals"],
    queryFn: () => listProposals(),
    enabled: hasCapability("manage_content"),
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Published club projects. Propose your own and build with a team.
          </p>
        </div>
        <Button onClick={() => setProposing(true)}>
          <PlusIcon /> New proposal
        </Button>
      </header>

      <section aria-label="Published projects">
        <AsyncBoundary
          query={projectsQuery}
          isEmpty={(projects) => projects.length === 0}
          empty={{
            icon: FolderKanbanIcon,
            title: "No published projects",
            description: "Approved proposals appear here as published projects.",
          }}
        >
          {(projects) => (
            <ul className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="bg-card hover:border-primary/50 hover:shadow-md flex h-full flex-col gap-3 rounded-xl border p-5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-base font-semibold">{project.title}</h2>
                      {project.state === "CLOSED" ? <Badge variant="secondary">Closed</Badge> : null}
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm">{project.summary}</p>
                    <div className="mt-auto flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">
                        {project.team_memberships.filter((membership) => !membership.left_at).length}/{project.team_capacity} members
                      </span>
                      <Progress value={project.progress} className="h-1.5 flex-1" />
                      <span className="text-muted-foreground tabular-nums">{project.progress}%</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AsyncBoundary>
      </section>

      {hasCapability("manage_content") ? (
        <section aria-label="Proposals">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Proposals</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Your proposals plus those you can review.
          </p>
          <div className="mt-3">
            <AsyncBoundary
              query={proposalsQuery}
              isEmpty={(proposals) => proposals.length === 0}
              empty={{ title: "No proposals yet" }}
            >
              {(proposals) => <ProposalList proposals={proposals} />}
            </AsyncBoundary>
          </div>
        </section>
      ) : null}

      <ProposalDialog open={proposing} onOpenChange={setProposing} />
    </div>
  );
}

function ProposalList({
  proposals,
}: {
  proposals: Awaited<ReturnType<typeof listProposals>>;
}) {
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: submitProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Proposal submitted for review.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not submit."),
  });

  const review = useMutation({
    mutationFn: ({ proposalId, decision }: { proposalId: number; decision: "APPROVE" | "REJECT" }) =>
      reviewProposal(proposalId, decision),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(
        result.state === "APPROVED" ? "Proposal approved — project published." : "Proposal rejected.",
      );
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not review."),
  });

  const stateVariant = {
    DRAFT: "warning",
    SUBMITTED: "info",
    APPROVED: "success",
    REJECTED: "destructive",
  } as const;

  return (
    <ul className="flex flex-col gap-3">
      {proposals.map((proposal) => {
        const isOwner = proposal.state === "DRAFT" || proposal.state === "REJECTED";
        return (
          <li key={proposal.id} className="bg-card flex flex-wrap items-center gap-3 rounded-xl border p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{proposal.title}</p>
                <Badge variant={stateVariant[proposal.state]}>{proposal.state.toLowerCase()}</Badge>
              </div>
              <p className="text-muted-foreground line-clamp-1 text-xs">{proposal.summary}</p>
            </div>
            {isOwner ? (
              <Button variant="outline" size="sm" onClick={() => submit.mutate(proposal.id)}>
                Submit for review
              </Button>
            ) : null}
            {proposal.state === "SUBMITTED" ? (
              <ReviewButtons onReview={(decision) => review.mutate({ proposalId: proposal.id, decision })} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function ReviewButtons({ onReview }: { onReview: (decision: "APPROVE" | "REJECT") => void }) {
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => onReview("APPROVE")}>
        <CheckCircle2Icon /> Approve
      </Button>
      <Button size="sm" variant="destructive" onClick={() => onReview("REJECT")}>
        <XCircleIcon /> Reject
      </Button>
    </div>
  );
}

function ProposalDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("5");
  const [sigId, setSigId] = useState("none");
  const [formError, setFormError] = useState<string | null>(null);

  const sigs = useQuery({ queryKey: ["sigs"], queryFn: () => listSigs(), enabled: open });

  const create = useMutation({
    mutationFn: async () => {
      setFormError(null);
      const values = parseForm(
        proposalSchema,
        { title, summary, description, team_capacity: capacity },
        (_field, message) => setFormError(message),
      );
      if (!values) return null;
      return createProposal({
        ...values,
        sig_id: sigId === "none" ? null : Number(sigId),
      });
    },
    onSuccess: (proposal) => {
      if (!proposal) return;
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Proposal saved as a draft — submit it when ready.");
      onOpenChange(false);
      setTitle("");
      setSummary("");
      setDescription("");
    },
    onError: (error) =>
      setFormError(error instanceof ApiError ? error.message : "Could not create the proposal."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New project proposal</DialogTitle>
          <DialogDescription>
            Approved proposals become published projects with open roles.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
          noValidate
        >
          <Field label="Title" htmlFor="prop-title" error={formError ?? undefined}>
            <Input id="prop-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Summary" htmlFor="prop-summary">
            <Input id="prop-summary" value={summary} onChange={(event) => setSummary(event.target.value)} />
          </Field>
          <Field label="Description" htmlFor="prop-description">
            <Textarea id="prop-description" rows={5} value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Team capacity" htmlFor="prop-capacity">
              <Input id="prop-capacity" type="number" min={1} max={100} value={capacity} onChange={(event) => setCapacity(event.target.value)} />
            </Field>
            <Field label="SIG (optional)" htmlFor="prop-sig">
              <select
                id="prop-sig"
                value={sigId}
                onChange={(event) => setSigId(event.target.value)}
                className="border-input h-9 w-full rounded-lg border bg-transparent px-3 text-sm"
              >
                <option value="none">Global</option>
                {(sigs.data ?? []).map((sig) => (
                  <option key={sig.id} value={String(sig.id)}>
                    {sig.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Save proposal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
