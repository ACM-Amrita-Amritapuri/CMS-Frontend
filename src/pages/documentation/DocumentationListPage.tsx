import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpenIcon, FileTextIcon, SearchIcon } from "lucide-react";
import { z } from "zod";

import {
  createDocument,
  listDocuments,
  searchDocuments,
} from "@/lib/api/documentation";
import { listSigs } from "@/lib/api/admin";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/errors";
import { parseForm } from "@/lib/form-validation";
import { useSession } from "@/app/providers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page";
import { StatusBadge } from "@/components/ui/status-badge";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Field, Input, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PAGE_SIZE = 20;

export default function DocumentationListPage() {
  useDocumentTitle("Documentation");
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const rawOffset = Number(searchParams.get("offset") ?? 0);
  const offset = Number.isSafeInteger(rawOffset) && rawOffset > 0 ? rawOffset : 0;
  const [input, setInput] = useState(q);
  const [creating, setCreating] = useState(false);

  // q in the URL uses the search endpoint (published only); the bare list is
  // the manager/recent view that also includes the caller's drafts.
  const searchQuery = useQuery({
    queryKey: queryKeys.documentation.search(q, PAGE_SIZE, offset),
    queryFn: ({ signal }) => searchDocuments({ q, limit: PAGE_SIZE, offset }, signal),
    enabled: q !== "",
  });
  const listQuery = useQuery({
    queryKey: queryKeys.documentation.list(PAGE_SIZE, offset),
    queryFn: ({ signal }) => listDocuments({ limit: PAGE_SIZE, offset }, signal),
    enabled: q === "",
  });

  const query = q !== "" ? searchQuery : listQuery;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Knowledge"
        description="Search published documents and manage drafts in the club knowledge base."
        actions={<CreateDocumentButton open={creating} onOpenChange={setCreating} />}
      />

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setSearchParams(input.trim() ? { q: input.trim() } : {});
        }}
      >
        <div className="relative min-w-0 basis-full sm:flex-1">
          <SearchIcon aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Search published documents…"
            className="pl-9"
            aria-label="Search documents"
          />
        </div>
        <Button type="submit">Search</Button>
        {q ? (
          <Button type="button" variant="ghost" onClick={() => { setInput(""); setSearchParams({}); }}>
            Clear
          </Button>
        ) : null}
      </form>

      <AsyncBoundary
        query={query}
        isEmpty={(page) => page.total === 0}
        empty={
          q
            ? { icon: SearchIcon, title: `No results for “${q}”`, description: "Search matches titles, summaries, and bodies." }
            : {
                icon: BookOpenIcon,
                title: "No documents yet",
                description: "Documentation will appear here once authors publish it.",
              }
        }
      >
        {(items) => (
          <div className="flex flex-col gap-4">
          <ul className="divide-y border-y">
            {items.documents.map((doc) => (
              <li key={doc.id}>
                <Link
                  to={`/documentation/${doc.id}`}
                  className="hover:bg-muted/40 focus-visible:ring-ring flex min-w-0 items-start gap-4 rounded-lg px-3 py-5 transition-colors focus-visible:ring-2 focus-visible:ring-inset sm:px-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileTextIcon className="text-primary size-4 shrink-0" aria-hidden />
                      <h2 className="min-w-0 break-words text-base font-semibold leading-6 [overflow-wrap:anywhere]">{doc.title}</h2>
                      {doc.state ? <StatusBadge status={doc.state} /> : null}
                    </div>
                    {doc.summary ? <p className="text-muted-foreground mt-2 line-clamp-2 break-words text-sm leading-6 [overflow-wrap:anywhere]">{doc.summary}</p> : null}
                    <div className="text-muted-foreground mt-2 flex flex-wrap gap-1.5 text-xs">
                    {doc.category ? <Badge variant="outline">{doc.category}</Badge> : null}
                    {doc.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <PaginationControls
            label="Documents"
            offset={items.offset}
            limit={items.limit}
            total={items.total}
            onPageChange={(nextOffset) => {
              const next = new URLSearchParams(searchParams);
              if (nextOffset === 0) next.delete("offset");
              else next.set("offset", String(nextOffset));
              setSearchParams(next);
            }}
          />
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}

function CreateDocumentButton({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { hasCapability } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [sigId, setSigId] = useState("none");
  const [formError, setFormError] = useState<string | null>(null);

  const sigs = useQuery({ queryKey: queryKeys.sigs.list(), queryFn: ({ signal }) => listSigs(undefined, signal), enabled: open });

  const docSchema = z.object({
    title: z.string().min(1, "Enter a title."),
    body: z.string().min(1, "Write the document body."),
  });

  const create = useMutation({
    mutationFn: async () => {
      setFormError(null);
      const values = parseForm(docSchema, { title, body }, (_field, message) =>
        setFormError(message),
      );
      if (!values) return null;
      return createDocument({
        ...values,
        summary: summary.trim() || undefined,
        category: category.trim() || undefined,
        tags: tags.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean),
        sig_id: sigId === "none" ? null : Number(sigId),
      });
    },
    onSuccess: (doc) => {
      if (!doc) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.documentation.lists });
      toast.success("Document created as a draft.");
      onOpenChange(false);
      navigate(`/documentation/${doc.id}`);
    },
    onError: (error) =>
      setFormError(error instanceof ApiError ? error.message : "Could not create the document."),
  });

  if (!hasCapability("manage_content")) return null;

  return (
    <>
      <Button onClick={() => onOpenChange(true)}>
        <FileTextIcon /> New document
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>New document</DialogTitle>
            <DialogDescription>
              Starts as a draft you can edit before submitting for review.
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
            <Field label="Title" htmlFor="doc-title" error={formError ?? undefined}>
              <Input id="doc-title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field label="Summary" htmlFor="doc-summary">
              <Input id="doc-summary" value={summary} onChange={(event) => setSummary(event.target.value)} />
            </Field>
            <Field label="Body (Markdown)" htmlFor="doc-body">
              <Textarea id="doc-body" rows={7} value={body} onChange={(event) => setBody(event.target.value)} />
            </Field>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <Field label="Category" htmlFor="doc-category">
                <Input id="doc-category" value={category} onChange={(event) => setCategory(event.target.value)} />
              </Field>
              <Field label="Tags" htmlFor="doc-tags" hint="Comma-separated.">
                <Input id="doc-tags" value={tags} onChange={(event) => setTags(event.target.value)} />
              </Field>
            </div>
            <Field label="SIG (optional)" htmlFor="doc-sig">
              <NativeSelect
                id="doc-sig"
                value={sigId}
                onChange={(event) => setSigId(event.target.value)}
              >
                <option value="none">Global</option>
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
                Create draft
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
