"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ListChecksIcon, TrophyIcon } from "lucide-react";

import { attemptQuiz, getQuiz, setQuizState, type LearningQuiz } from "@/lib/api/learning";
import { ApiError } from "@/lib/api/errors";
import { useSession } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";

export function QuizRunner({ quiz }: { quiz: LearningQuiz }) {
  const { hasCapability } = useSession();
  const queryClient = useQueryClient();

  // Fetch live so freshly authored questions appear without a full page reload.
  const quizQuery = useQuery({
    queryKey: ["learning", "quiz", quiz.id],
    queryFn: () => getQuiz(quiz.id),
    initialData: quiz,
  });
  const current = quizQuery.data;

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [attempt, setAttempt] = useState<{ score: number; total_questions: number } | null>(null);
  const [pending, setPending] = useState(false);

  if (!current) return null;

  const submit = async () => {
    setPending(true);
    try {
      const stringAnswers = Object.fromEntries(
        Object.entries(answers).map(([questionId, choice]) => [questionId, choice]),
      );
      const result = await attemptQuiz(current.id, stringAnswers);
      setAttempt({ score: result.score, total_questions: result.total_questions });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not submit the attempt.");
    } finally {
      setPending(false);
    }
  };

  return (
    <article className="bg-card flex flex-col gap-5 rounded-xl border p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{current.title}</h2>
          <p className="text-muted-foreground text-xs">
            {current.questions.length} question{current.questions.length === 1 ? "" : "s"}
          </p>
        </div>
        {hasCapability("manage_content") && current.publication_state === "DRAFT" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await setQuizState(current.id, "PUBLISHED");
                queryClient.invalidateQueries({ queryKey: ["learning"] });
                toast.success("Quiz published.");
              } catch (error) {
                toast.error(error instanceof ApiError ? error.message : "Could not publish.");
              }
            }}
          >
            Publish quiz
          </Button>
        ) : null}
      </header>

      {current.instructions ? <Markdown source={current.instructions} /> : null}

      {attempt ? (
        <div className="border-success/40 bg-success/10 flex items-center gap-3 rounded-xl border p-4">
          <TrophyIcon className="text-success size-5" />
          <p className="text-sm">
            Scored <strong>{attempt.score}%</strong> ({attempt.total_questions} questions).
          </p>
        </div>
      ) : current.questions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No questions yet.</p>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          {current.questions.map((question, index) => (
            <fieldset key={question.id} className="rounded-xl border p-4">
              <legend className="px-1 text-sm font-medium">
                {index + 1}. {question.prompt}
              </legend>
              <div className="flex flex-col gap-2">
                {question.choices.map((choice, choiceIndex) => (
                  <label
                    key={choiceIndex}
                    className="hover:bg-accent/50 flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-sm transition-colors"
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={answers[question.id] === choiceIndex}
                      onChange={() =>
                        setAnswers((current) => ({ ...current, [question.id]: choiceIndex }))
                      }
                      className="accent-[var(--primary)]"
                    />
                    {choice}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <Button type="submit" className="w-fit" disabled={pending || Object.keys(answers).length !== current.questions.length}>
            <ListChecksIcon /> Submit answers
          </Button>
        </form>
      )}
    </article>
  );
}
