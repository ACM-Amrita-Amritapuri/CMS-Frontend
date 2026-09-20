import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowUpRightIcon, GraduationCapIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { z } from "zod";

import { createPath, listPaths } from "@/lib/api/learning";
import { listSigs } from "@/lib/api/admin";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/errors";
import { parseForm } from "@/lib/form-validation";
import { slugify } from "@/lib/formatters/slug";
import { useSession } from "@/app/providers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
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
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: queryKeys.learning.paths, queryFn: ({ signal }) => listPaths(signal) });

  return (
    <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
      <PageHeader
        title="Learning"
        description="Structured paths with lessons and assignments."
        eyebrow="Course library"
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
        {(paths) => {
          const normalized = search.trim().toLowerCase();
          const filtered = paths.filter((path) =>
            !normalized || `${path.title} ${path.description ?? ""}`.toLowerCase().includes(normalized),
          );

          return (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative min-w-0 flex-1 sm:max-w-2xl">
                  <SearchIcon aria-hidden className="text-muted-foreground pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    type="search"
                    aria-label="Search learning paths"
                    placeholder="Search paths, topics, or modules"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-10 rounded-lg pl-10 pr-10"
                  />
                  {search ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Clear search"
                      className="text-muted-foreground absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => setSearch("")}
                    >
                      <XIcon />
                    </Button>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-sm">
                  {filtered.length} {filtered.length === 1 ? "path" : "paths"}
                </p>
              </div>
              {filtered.length === 0 ? (
                <div role="status" className="rounded-xl border border-dashed py-12 text-center">
                  <p className="text-sm font-medium">No paths match your search</p>
                  <Button type="button" variant="link" size="sm" className="mt-1" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                </div>
              ) : (
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((path) => (
                    <li key={path.id} className="min-w-0">
                      <Link
                        to={`/learning/paths/${path.id}`}
                        className="group flex h-full min-h-44 flex-col rounded-xl border bg-card p-5 transition-colors hover:border-foreground/25 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h2 className="min-w-0 break-words text-base font-semibold leading-6 tracking-tight [overflow-wrap:anywhere]">{path.title}</h2>
                            {path.publication_state === "DRAFT" ? <Badge variant="warning">Draft</Badge> : null}
                          </div>
                          <ArrowUpRightIcon aria-hidden className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                        </div>
                        {path.description ? <p className="text-muted-foreground mt-4 line-clamp-3 flex-1 break-words text-sm leading-6 [overflow-wrap:anywhere]">{path.description}</p> : <div className="flex-1" />}
                        <div className="text-muted-foreground mt-5 flex items-center border-t pt-3 text-xs">
                          <span>{path.modules?.length ?? 0} modules</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        }}
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

  const sigs = useQuery({ queryKey: queryKeys.sigs.list(), queryFn: ({ signal }) => listSigs(undefined, signal), enabled: open });

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
      queryClient.invalidateQueries({ queryKey: queryKeys.learning.paths });
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
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6">
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
          {formError ? (
            <p role="alert" className="text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
              {formError}
            </p>
          ) : null}
          <Field label="Title" htmlFor="path-title">
            <Input
              id="path-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setFormError(null);
                if (!slug) setSlug(slugify(event.target.value));
              }}
              placeholder="e.g. Web Foundations"
            />
          </Field>
          <Field label="Slug" htmlFor="path-slug">
            <Input
              id="path-slug"
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
                setFormError(null);
              }}
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
            <NativeSelect
              id="path-sig"
              value={sigId}
              onChange={(event) => setSigId(event.target.value)}
            >
              <option value="none">Global (no SIG)</option>
              {(sigs.data ?? []).map((sig) => (
                <option key={sig.id} value={String(sig.id)}>
                  {sig.name}
                </option>
              ))}
            </NativeSelect>
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
