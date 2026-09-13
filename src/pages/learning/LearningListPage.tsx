import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GraduationCapIcon, PlusIcon } from "lucide-react";
import { z } from "zod";

import { createPath, listPaths } from "@/lib/api/learning";
import { listSigs } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/errors";
import { parseForm } from "@/lib/form-validation";
import { slugify } from "@/lib/formatters/slug";
import { useSession } from "@/app/providers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page";
import { Field, Input, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const pathSchema = z.object({
  title: z.string().min(1, "Enter a title."),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Lowercase letters, digits, hyphens."),
});

export default function LearningListPage() {
  useDocumentTitle("Learning");
  const { hasCapability } = useSession();
  const [creating, setCreating] = useState(false);
  const query = useQuery({ queryKey: ["learning", "paths"], queryFn: listPaths });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Learning"
        description="Structured paths with lessons and assignments."
        actions={hasCapability("manage_content") ? <Button onClick={() => setCreating(true)}><PlusIcon /> New path</Button> : undefined}
      />

      <AsyncBoundary
        query={query}
        isEmpty={(paths) => paths.length === 0}
        empty={{
          icon: GraduationCapIcon,
          title: "No learning paths yet",
          description: hasCapability("manage_content")
            ? "Create the first path to start building club curriculum."
            : "Published paths will appear here once authors release them.",
        }}
      >
        {(paths) => (
          <ul className="divide-y border-y">
            {paths.map((path) => (
              <li key={path.id}>
                <Link
                  to={`/learning/paths/${path.id}`}
                  className="hover:bg-muted/40 flex items-start justify-between gap-4 px-1 py-4 transition-colors sm:px-2"
                >
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold">{path.title}</h2>
                    {path.description ? <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{path.description}</p> : null}
                    <p className="text-muted-foreground mt-2 text-xs">{path.modules?.length ?? 0} modules</p>
                  </div>
                  {path.publication_state === "DRAFT" ? <Badge variant="warning">Draft</Badge> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AsyncBoundary>

      <CreatePathDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function CreatePathDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sigId, setSigId] = useState("none");
  const [formError, setFormError] = useState<string | null>(null);

  const sigs = useQuery({ queryKey: ["sigs"], queryFn: () => listSigs(), enabled: open });

  const create = useMutation({
    mutationFn: async () => {
      setFormError(null);
      const values = parseForm(pathSchema, { title, slug }, (_field, message) =>
        setFormError(message),
      );
      if (!values) return null;
      return createPath({
        ...values,
        description: description.trim() || null,
        sig_id: sigId === "none" ? null : Number(sigId),
      });
    },
    onSuccess: (path) => {
      if (!path) return;
      queryClient.invalidateQueries({ queryKey: ["learning", "paths"] });
      toast.success("Path created as a draft.");
      onOpenChange(false);
      setTitle("");
      setSlug("");
      setDescription("");
    },
    onError: (error) =>
      setFormError(error instanceof ApiError ? error.message : "Could not create the path."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a learning path</DialogTitle>
          <DialogDescription>
            Paths start as drafts; publish when the content is ready.
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
          <Field label="Title" htmlFor="path-title" error={formError ?? undefined}>
            <Input
              id="path-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slug) setSlug(slugify(event.target.value));
              }}
              placeholder="e.g. Web Foundations"
            />
          </Field>
          <Field label="Slug" htmlFor="path-slug">
            <Input
              id="path-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="font-mono"
              placeholder="web-foundations"
            />
          </Field>
          <Field label="Description" htmlFor="path-description">
            <Textarea
              id="path-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
          <Field label="SIG (optional)" htmlFor="path-sig">
            <select
              id="path-sig"
              value={sigId}
              onChange={(event) => setSigId(event.target.value)}
              className="border-input focus-visible:ring-ring/50 h-9 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
            >
              <option value="none">Global (no SIG)</option>
              {(sigs.data ?? []).map((sig) => (
                <option key={sig.id} value={String(sig.id)}>
                  {sig.name}
                </option>
              ))}
            </select>
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Create path
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
