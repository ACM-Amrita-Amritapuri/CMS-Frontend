import { memo, useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLinkIcon, SendIcon } from "lucide-react";

import {
  getMySubmission,
  listSubmissions,
  type LearningSubmission,
  reviewSubmission,
  setAssignmentState,
  submitAssignment,
  type LearningAssignment,
} from "@/lib/api/learning";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/query-keys";
import { useSession } from "@/app/providers";
import { formatDateTime } from "@/lib/formatters/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { DetailRow } from "@/components/ui/table";
import { QueryErrorState } from "@/components/ui/async";

const SubmissionReview = memo(function SubmissionReview({ submission, onReviewed }: {
  submission: LearningSubmission;
  onReviewed: (submission: LearningSubmission) => void;
}) {
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [score, setScore] = useState(submission.score?.toString() ?? "");
  const [pending, setPending] = useState(false);
  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-lg border p-3 sm:p-4">
      <h3 className="break-words text-sm font-semibold leading-6 [overflow-wrap:anywhere]">
        Submission #{submission.id}
        {submission.member_username ? ` · ${submission.member_username}` : submission.member_user_id ? ` · Member #${submission.member_user_id}` : ""}
      </h3>
      <Badge className="w-fit" variant="secondary">{submission.submission_state}</Badge>
      <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">{submission.content || submission.external_url}</p>
      {submission.submission_state === "SUBMITTED" ? (
        <form className="flex flex-col gap-3" onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          try {
            onReviewed(await reviewSubmission(submission.id, {
              feedback: feedback || undefined,
              score: score === "" ? undefined : Number(score),
            }));
            toast.success("Review saved.");
          } catch (error) {
            toast.error(error instanceof ApiError ? error.message : "Could not review.");
          } finally {
            setPending(false);
          }
        }}>
          <Field label="Feedback" htmlFor={`feedback-${submission.id}`}>
            <Textarea id={`feedback-${submission.id}`} value={feedback} onChange={(event) => setFeedback(event.target.value)} disabled={pending} />
          </Field>
          <Field label="Score (0–100)" htmlFor={`score-${submission.id}`}>
            <Input id={`score-${submission.id}`} type="number" min={0} max={100} value={score} onChange={(event) => setScore(event.target.value)} disabled={pending} />
          </Field>
          <Button type="submit" className="w-fit" disabled={pending}>Save review</Button>
        </form>
      ) : <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">{submission.feedback}{submission.score !== null ? ` · ${submission.score}/100` : ""}</p>}
    </article>
  );
});

const stateLabels: Record<string, { label: string; variant: "success" | "info" | "warning" }> = {
  SUBMITTED: { label: "Awaiting review", variant: "info" },
  REVIEWED: { label: "Reviewed", variant: "success" },
  DRAFT: { label: "Draft", variant: "warning" },
};

export function AssignmentPanel({ assignment }: { assignment: LearningAssignment }) {
  const { user } = useSession();
  return <AssignmentContent key={`${assignment.id}:${user?.id}`} assignment={assignment} />;
}

function AssignmentContent({ assignment }: { assignment: LearningAssignment }) {
  const { hasCapability } = useSession();
  const queryClient = useQueryClient();
  const submissionKey = useMemo(
    () => queryKeys.learning.mySubmission(assignment.id),
    [assignment.id],
  );
  const mine = useQuery({
    queryKey: submissionKey,
    queryFn: ({ signal }) => getMySubmission(assignment.id, signal),
    retry: false,
  });
  const submission = mine.data;
  const handleReviewed = useCallback((updated: LearningSubmission) => {
    queryClient.setQueryData<LearningSubmission[]>(queryKeys.learning.submissions(assignment.id),
      (current = []) => current.map((entry) => entry.id === updated.id ? updated : entry));
    if (submission?.id === updated.id) queryClient.setQueryData(submissionKey, updated);
    queryClient.invalidateQueries({ queryKey: queryKeys.learning.all, refetchType: "none" });
    queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all });
  }, [assignment.id, queryClient, submission?.id, submissionKey]);
  const [editedValue, setValue] = useState<string | null>(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const queue = useQuery({
    queryKey: queryKeys.learning.submissions(assignment.id),
    queryFn: ({ signal }) => listSubmissions(assignment.id, signal),
    enabled: queueOpen && hasCapability("manage_content"),
    retry: false,
  });
  const [pending, setPending] = useState(false);

  const isLink = assignment.assignment_type === "LINK";
  const value = editedValue ?? (isLink ? submission?.external_url : submission?.content) ?? "";

  const submit = async (submissionState: "DRAFT" | "FINAL") => {
    setPending(true);
    try {
      const result = await submitAssignment(assignment.id, {
        submission_state: submissionState,
        ...(isLink ? { external_url: value } : { content: value }),
      });
      queryClient.setQueryData(submissionKey, result);
      setValue(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.learning.submissions(assignment.id) });
      toast.success(result.submission_state === "SUBMITTED" ? "Submitted for review." : "Draft saved.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not submit.");
    } finally {
      setPending(false);
    }
  };


  return (
    <article className="bg-card flex min-w-0 flex-col gap-6 rounded-xl border p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div className="min-w-0 flex-1 basis-48">
          <h2 className="break-words text-lg font-semibold leading-7 [overflow-wrap:anywhere]">{assignment.title}</h2>
          <p className="text-muted-foreground text-xs">
            Submit {isLink ? "a link" : "text"}
            {assignment.deadline_at ? ` · due ${formatDateTime(assignment.deadline_at)}` : " · no deadline"}
          </p>
        </div>
        {hasCapability("manage_content") && assignment.publication_state === "DRAFT" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await setAssignmentState(assignment.id, "PUBLISHED");
                queryClient.invalidateQueries({ queryKey: queryKeys.learning.all });
                toast.success("Assignment published.");
              } catch (error) {
                toast.error(error instanceof ApiError ? error.message : "Could not publish.");
              }
            }}
          >
            Publish assignment
          </Button>
        ) : null}
      </header>

      <div className="min-w-0 [overflow-wrap:anywhere]">
        <Markdown source={assignment.instructions} />
      </div>

      {submission ? (
        <div className="rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">Submission</p>
            <Badge variant={stateLabels[submission.submission_state ?? "DRAFT"].variant}>
              {stateLabels[submission.submission_state ?? "DRAFT"].label}
            </Badge>
          </div>
          <dl className="mt-3 flex min-w-0 flex-col gap-3 [overflow-wrap:anywhere]">
            <DetailRow label="Submitted">
              {submission.submission_state === "DRAFT"
                ? "Not yet"
                : formatDateTime(submission.submitted_at)}
            </DetailRow>
            {isLink ? (
              <DetailRow label="Link">
                {submission.external_url ? (
                  <a
                    href={submission.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex max-w-full items-start gap-1 rounded hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="min-w-0 [overflow-wrap:anywhere]">{submission.external_url}</span>
                    <ExternalLinkIcon className="mt-1 size-3 shrink-0" />
                  </a>
                ) : (
                  "—"
                )}
              </DetailRow>
            ) : (
              <DetailRow label="Content">{submission.content}</DetailRow>
            )}
            {submission.feedback ? <DetailRow label="Feedback">{submission.feedback}</DetailRow> : null}
            {submission.score !== null && submission.score !== undefined ? (
              <DetailRow label="Score">{submission.score}/100</DetailRow>
            ) : null}
          </dl>
        </div>
      ) : null}

      {mine.isPending ? <p role="status">Loading your submission…</p> : mine.isError ? (
        <QueryErrorState error={mine.error} retry={() => mine.refetch()} />
      ) : <section className="border-t pt-4">
        <h3 className="text-sm font-semibold">{submission ? "Update submission" : "Your work"}</h3>
        <div className="mt-3 flex flex-col gap-3">
          {isLink ? (
            <Field
              label="Submission link"
              htmlFor="submit-link"
              hint="Must start with http:// or https://"
            >
              <Input
                id="submit-link"
                type="url"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="https://github.com/..."
              />
            </Field>
          ) : (
            <Field label="Submission text" htmlFor="submit-text">
              <Textarea
                id="submit-text"
                rows={5}
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            </Field>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button disabled={pending || !value.trim()} onClick={() => submit("FINAL")}>
              <SendIcon /> Submit final
            </Button>
            <Button variant="outline" disabled={pending || !value.trim()} onClick={() => submit("DRAFT")}>
              Save draft
            </Button>
          </div>
        </div>
      </section>}

      {hasCapability("manage_content") ? (
        <section className="flex flex-col gap-3 border-t pt-4" aria-label="Review queue">
          <Button variant="outline" className="w-fit" onClick={() => setQueueOpen((open) => !open)}>
            {queueOpen ? "Hide review queue" : "Load review queue"}
          </Button>
          {queueOpen ? queue.isPending ? <p role="status">Loading submissions…</p> : queue.isError ? (
            <QueryErrorState error={queue.error} retry={() => queue.refetch()} />
          ) : queue.data.length === 0 ? <p>No submissions to review.</p> : (
            <ul className="flex flex-col gap-3">
              {queue.data.map((item) => (
                <li key={item.id}>
                  <SubmissionReview submission={item} onReviewed={handleReviewed} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}
