import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeftIcon, HistoryIcon, PencilIcon, SendIcon } from "lucide-react";

import {
  getDocument,
  listRevisions,
  reviewDocument,
  runDocumentAction,
  updateDocument,
  type ClubDocument,
  type DocumentState,
} from "@/lib/api/documentation";
import { ApiError } from "@/lib/api/errors";
import { useSession } from "@/app/providers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDateTime } from "@/lib/formatters/date";
import { AsyncBoundary } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { DetailRow, EmptyState } from "@/components/ui/table";

const stateVariants: Record<DocumentState, "success" | "info" | "warning" | "destructive" | "secondary"> = {
  PUBLISHED: "success",
  APPROVED: "info",
  SUBMITTED: "info",
  DRAFT: "warning",
  REJECTED: "destructive",
  ARCHIVED: "secondary",
};

export default function DocumentDetailPage() {
  useDocumentTitle("Document");
  const { documentId } = useParams();
  const id = Number(documentId);
  const invalidId = !documentId || Number.isNaN(id);
  const query = useQuery({
    queryKey: ["documentation", "document", invalidId ? documentId : id],
    queryFn: () => getDocument(id),
    enabled: !invalidId,
  });

  if (invalidId) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <EmptyState title="Document not found" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/documentation">
          <ArrowLeftIcon /> All documents
        </Link>
      </Button>
      <AsyncBoundary query={query} empty={{ title: "Document not found" }}>
        {(doc) => <DocumentReader documentId={id} document={doc} />}
      </AsyncBoundary>
    </div>
  );
}

function DocumentReader({
  documentId,
  document: doc,
}: {
  documentId: number;
  document: ClubDocument;
}) {
  const { user, hasCapability } = useSession();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["documentation"] });
  };

  const act = useMutation({
    mutationFn: (action: "submit" | "publish" | "archive" | "restore") =>
      runDocumentAction(documentId, action),
    onSuccess: (result, action) => {
      invalidate();
      toast.success(
        action === "submit" ? "Submitted for review." :
        action === "publish" ? "Document published." :
        action === "archive" ? "Document archived." : "Restored to draft.",
      );
      void result;
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "The action failed."),
  });

  const review = useMutation({
    mutationFn: (decision: "APPROVE" | "REJECT") =>
      reviewDocument(documentId, { decision, comment: reviewComment.trim() }),
    onSuccess: (result) => {
      invalidate();
      setReviewComment("");
      toast.success(`Review recorded: ${result.state.toLowerCase()}.`);
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not review."),
  });

  const isOwner = user?.id === doc.owner_user_id;
  const canManage = hasCapability("manage_content");

  return editing ? (
    <DocumentEditor document={doc} onDone={() => setEditing(false)} />
  ) : (
    <article className="bg-card flex flex-col gap-5 rounded-xl border p-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{doc.title}</h1>
          <Badge variant={stateVariants[doc.state]}>{doc.state.toLowerCase()}</Badge>
        </div>
        {doc.summary ? <p className="text-muted-foreground text-sm">{doc.summary}</p> : null}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {doc.category ? <Badge variant="outline">{doc.category}</Badge> : null}
          {doc.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              #{tag}
            </Badge>
          ))}
        </div>
      </header>

      <Markdown source={doc.body ?? ""} />

      <dl className="border-t flex flex-col gap-2 pt-4">
        <DetailRow label="State">{doc.state}</DetailRow>
        {doc.review_comment ? <DetailRow label="Review note">{doc.review_comment}</DetailRow> : null}
        {doc.reviewed_at ? <DetailRow label="Reviewed">{formatDateTime(doc.reviewed_at)}</DetailRow> : null}
      </dl>

      <WorkflowActions
        doc={doc}
        isOwner={isOwner}
        canManage={canManage}
        pending={act.isPending}
        onAction={(action) => act.mutate(action)}
        onEdit={() => setEditing(true)}
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory((value) => !value)}
      />

      {showHistory ? <RevisionHistory documentId={documentId} /> : null}

      {canManage && doc.state === "SUBMITTED" && !isOwner ? (
        <section className="border-t pt-4">
          <h3 className="text-sm font-semibold">Review</h3>
          <div className="mt-3 flex flex-col gap-3">
            <Field label="Comment (required)" htmlFor="review-comment">
              <Textarea
                id="review-comment"
                rows={2}
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
              />
            </Field>
            <div className="flex gap-2">
              <Button
                disabled={review.isPending || !reviewComment.trim()}
                onClick={() => review.mutate("APPROVE")}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                disabled={review.isPending || !reviewComment.trim()}
                onClick={() => review.mutate("REJECT")}
              >
                Reject
              </Button>
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}

function WorkflowActions({
  doc,
  isOwner,
  canManage,
  pending,
  onAction,
  onEdit,
  showHistory,
  onToggleHistory,
}: {
  doc: ClubDocument;
  isOwner: boolean;
  canManage: boolean;
  pending: boolean;
  onAction: (action: "submit" | "publish" | "archive" | "restore") => void;
  onEdit: () => void;
  showHistory: boolean;
  onToggleHistory: () => void;
}) {
  const actions: { label: string; action?: "submit" | "publish" | "archive" | "restore"; variant?: "default" | "outline" | "destructive" }[] = [];
  if (isOwner && (doc.state === "DRAFT" || doc.state === "REJECTED")) {
    actions.push({ label: "Submit for review", action: "submit" });
    actions.push({ label: "Edit", variant: "outline" });
  }
  if (canManage && doc.state === "APPROVED") actions.push({ label: "Publish", action: "publish" });
  if (canManage && doc.state === "PUBLISHED") actions.push({ label: "Archive", action: "archive", variant: "outline" });
  if (canManage && doc.state === "ARCHIVED") actions.push({ label: "Restore to draft", action: "restore", variant: "outline" });

  if (actions.length === 0 && !canManage) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-t pt-4">
      {actions.map((item) =>
        item.action ? (
          <Button
            key={item.label}
            variant={item.variant ?? "default"}
            disabled={pending}
            onClick={() => onAction(item.action!)}
          >
            {item.action === "submit" ? <SendIcon /> : null}
            {item.label}
          </Button>
        ) : (
          <Button key={item.label} variant={item.variant} onClick={onEdit}>
            <PencilIcon /> {item.label}
          </Button>
        ),
      )}
      <Button variant="ghost" size="sm" onClick={onToggleHistory} className="ml-auto">
        <HistoryIcon /> {showHistory ? "Hide" : "Revision"} history
      </Button>
    </div>
  );
}

function RevisionHistory({ documentId }: { documentId: number }) {
  const query = useQuery({
    queryKey: ["documentation", "revisions", documentId],
    queryFn: () => listRevisions(documentId),
  });

  return (
    <AsyncBoundary query={query} isEmpty={(revisions) => revisions.length === 0} empty={{ title: "No revisions" }}>
      {(revisions) => (
        <ol className="flex flex-col gap-3">
          {[...revisions].reverse().map((revision) => (
            <li key={revision.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  #{revision.revision_number} {revision.title}
                </p>
                <time className="text-muted-foreground text-xs">
                  {formatDateTime(revision.created_at)}
                </time>
              </div>
              {revision.summary ? (
                <p className="text-muted-foreground mt-1 text-xs">{revision.summary}</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </AsyncBoundary>
  );
}

function DocumentEditor({ document: doc, onDone }: { document: ClubDocument; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(doc.title);
  const [summary, setSummary] = useState(doc.summary);
  const [body, setBody] = useState(doc.body ?? "");
  const [category, setCategory] = useState(doc.category);
  const [tags, setTags] = useState(doc.tags.join(", "));

  const save = useMutation({
    mutationFn: () =>
      updateDocument(doc.id, {
        title,
        summary: summary.trim() || undefined,
        body,
        category: category.trim() || undefined,
        tags: tags.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentation"] });
      toast.success("Document updated (new revision saved).");
      onDone();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not save."),
  });

  return (
    <div className="bg-card flex flex-col gap-4 rounded-xl border p-6">
      <h2 className="text-lg font-semibold">Edit document</h2>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
        noValidate
      >
        <Field label="Title" htmlFor="edit-title">
          <Input id="edit-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </Field>
        <Field label="Summary" htmlFor="edit-summary">
          <Input id="edit-summary" value={summary} onChange={(event) => setSummary(event.target.value)} />
        </Field>
        <Field label="Body (Markdown)" htmlFor="edit-body">
          <Textarea id="edit-body" rows={12} value={body} onChange={(event) => setBody(event.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category" htmlFor="edit-category">
            <Input id="edit-category" value={category} onChange={(event) => setCategory(event.target.value)} />
          </Field>
          <Field label="Tags" htmlFor="edit-tags" hint="Comma-separated.">
            <Input id="edit-tags" value={tags} onChange={(event) => setTags(event.target.value)} />
          </Field>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={save.isPending}>
            Save changes
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
