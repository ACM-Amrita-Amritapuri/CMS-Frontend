"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLinkIcon, SendIcon } from "lucide-react";

import {
  reviewSubmission,
  setAssignmentState,
  submitAssignment,
  type LearningAssignment,
} from "@/lib/api/learning";
import { ApiError } from "@/lib/api/errors";
import { useSession } from "@/app/providers";
import { formatDateTime } from "@/lib/formatters/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { DetailRow } from "@/components/ui/table";

const stateLabels: Record<string, { label: string; variant: "success" | "info" | "warning" }> = {
  SUBMITTED: { label: "Awaiting review", variant: "info" },
  REVIEWED: { label: "Reviewed", variant: "success" },
  DRAFT: { label: "Draft", variant: "warning" },
};

export function AssignmentPanel({ assignment }: { assignment: LearningAssignment }) {
  const { hasCapability } = useSession();
  const queryClient = useQueryClient();

  // The backend has no submission-read endpoint, so the active submission is
  // tracked for the current session from the POST responses.
  const [submission, setSubmission] = useState<LearningAssignment | null>(null);
  const [value, setValue] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewScore, setReviewScore] = useState("");
  const [pending, setPending] = useState(false);

  const isLink = assignment.assignment_type === "LINK";

  const submit = async (submissionState: "DRAFT" | "FINAL") => {
    setPending(true);
    try {
      const result = await submitAssignment(assignment.id, {
        submission_state: submissionState,
        ...(isLink ? { external_url: value } : { content: value }),
      });
      setSubmission(result);
      setValue("");
      toast.success(result.submission_state === "SUBMITTED" ? "Submitted for review." : "Draft saved.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not submit.");
    } finally {
      setPending(false);
    }
  };

  const review = async () => {
    if (!submission) return;
    setPending(true);
    try {
      const result = await reviewSubmission(submission.id, {
        feedback: reviewFeedback || undefined,
        score: reviewScore === "" ? undefined : Number(reviewScore),
      });
      setSubmission(result);
      queryClient.invalidateQueries({ queryKey: ["learning"] });
      toast.success("Review saved.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not review.");
    } finally {
      setPending(false);
    }
  };

  return (
    <article className="bg-card flex flex-col gap-5 rounded-xl border p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{assignment.title}</h2>
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
                queryClient.invalidateQueries({ queryKey: ["learning"] });
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

      <Markdown source={assignment.instructions} />

      {submission ? (
        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Submission</p>
            <Badge variant={stateLabels[submission.submission_state ?? "DRAFT"].variant}>
              {stateLabels[submission.submission_state ?? "DRAFT"].label}
            </Badge>
          </div>
          <dl className="mt-3 flex flex-col gap-2">
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
                    className="text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    {submission.external_url} <ExternalLinkIcon className="size-3" />
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

      <section className="border-t pt-4">
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
          <div className="flex gap-2">
            <Button disabled={pending || !value.trim()} onClick={() => submit("FINAL")}>
              <SendIcon /> Submit final
            </Button>
            <Button variant="outline" disabled={pending || !value.trim()} onClick={() => submit("DRAFT")}>
              Save draft
            </Button>
          </div>
        </div>
      </section>

      {hasCapability("manage_content") && submission?.submission_state === "SUBMITTED" ? (
        <section className="border-t pt-4">
          <h3 className="text-sm font-semibold">Review submission</h3>
          <div className="mt-3 flex flex-col gap-3">
            <Field label="Feedback" htmlFor="review-feedback">
              <Textarea
                id="review-feedback"
                rows={3}
                value={reviewFeedback}
                onChange={(event) => setReviewFeedback(event.target.value)}
              />
            </Field>
            <Field label="Score (0–100)" htmlFor="review-score" className="w-40">
              <Input
                id="review-score"
                type="number"
                min={0}
                max={100}
                value={reviewScore}
                onChange={(event) => setReviewScore(event.target.value)}
              />
            </Field>
            <Button className="w-fit" onClick={review} disabled={pending}>
              <SendIcon /> Save review
            </Button>
          </div>
        </section>
      ) : null}
    </article>
  );
}
