import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LayersIcon, PencilIcon, PlusIcon } from "lucide-react";
import { z } from "zod";

import { createSig, listSigs, updateSig, type Sig } from "@/lib/api/admin";
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

const sigSchema = z.object({
  name: z.string().min(1, "Enter a SIG name."),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, digits, and hyphens."),
});

export default function AdminSigsPage() {
  useDocumentTitle("SIGs");
  const [editing, setEditing] = useState<Sig | null>(null);
  const [creating, setCreating] = useState(false);
  const query = useQuery({ queryKey: ["sigs"], queryFn: () => listSigs() });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SIGs</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Special interest groups and their activation state.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <PlusIcon /> New SIG
        </Button>
      </header>

      <AsyncBoundary
        query={query}
        isEmpty={(sigs) => sigs.length === 0}
        empty={{
          title: "No SIGs yet",
          description: "Create the first special interest group to scope content.",
        }}
      >
        {(sigs) => (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sigs.map((sig) => (
              <li
                key={sig.id}
                className="bg-card flex items-center gap-3 rounded-xl border p-4"
              >
                <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <LayersIcon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{sig.name}</p>
                  <p className="text-muted-foreground truncate font-mono text-xs">{sig.slug}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {sig.is_active ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  <Button variant="ghost" size="icon-sm" aria-label={`Edit ${sig.name}`} onClick={() => setEditing(sig)}>
                    <PencilIcon />
                  </Button>
                </div>
              </li>
            ))}
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
  const [slug, setSlug] = useState(sig?.slug ?? "");
  const [isActive, setIsActive] = useState(sig?.is_active ?? true);
  const [formError, setFormError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      setFormError(null);
      const values = parseForm(sigSchema, { name, slug }, (_field, message) =>
        setFormError(message),
      );
      if (!values) return;
      if (sig) {
        await updateSig(sig.id, { name: values.name, slug: values.slug, is_active: isActive });
      } else {
        await createSig(values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sigs"] });
      toast.success(sig ? "SIG updated." : "SIG created.");
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setFormError(error.message);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{sig ? `Edit ${sig.name}` : "Create a SIG"}</DialogTitle>
          <DialogDescription>
            The slug scopes content URLs; keep it short and lowercase.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
          noValidate
        >
          <Field label="Name" htmlFor="sig-name" error={formError ?? undefined}>
            <Input
              id="sig-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Web Development"
            />
          </Field>
          <Field label="Slug" htmlFor="sig-slug">
            <div className="flex gap-2">
              <Input
                id="sig-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="web-dev"
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setSlug(slugify(name))}
              >
                Auto
              </Button>
            </div>
          </Field>
          {sig ? (
            <label className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium">
              Active
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </label>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {sig ? "Save changes" : "Create SIG"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
