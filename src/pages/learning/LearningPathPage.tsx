import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CircleIcon,
  ExternalLinkIcon,
  FileTextIcon,
  ListChecksIcon,
  LockIcon,
  PlusIcon,
} from "lucide-react";

import {
  completeLesson,
  getPath,
  getPathProgress,
  setLessonState,
  setModuleState,
  setPathState,
  setResourceState,
  type LearningLesson,
  type LearningModule,
} from "@/lib/api/learning";
import { ApiError } from "@/lib/api/errors";
import { useSession } from "@/app/providers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { QueryErrorState } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { Progress } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/table";
import { AssignmentPanel } from "@/components/learning/assignment-panel";
import { AuthorDialog, useAuthorActions, type DialogKind } from "@/components/learning/author-dialogs";

export default function LearningPathPage() {
  useDocumentTitle("Learning path");
  const { pathId } = useParams();
  const id = Number(pathId);
  const invalidId = !pathId || Number.isNaN(id);
  const pathQuery = useQuery({
    queryKey: ["learning", "path", pathId],
    queryFn: () => getPath(id),
    enabled: !invalidId,
  });
  const progressQuery = useQuery({
    queryKey: ["learning", "progress", pathId],
    queryFn: () => getPathProgress(id),
    enabled: !invalidId,
  });

  const [selected, setSelected] = useState<Selection | null>(null);

  if (invalidId) {
    return <EmptyState title="Path not found" description="This learning path does not exist." />;
  }
  if (pathQuery.isPending) {
    return <div className="bg-muted h-64 animate-pulse rounded-xl" />;
  }
  if (pathQuery.isError) {
    return <QueryErrorState error={pathQuery.error} retry={() => pathQuery.refetch()} />;
  }

  const path = pathQuery.data;
  const modules = path.modules ?? [];
  const progress = progressQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link to="/learning">
            <ArrowLeftIcon /> All paths
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{path.title}</h1>
            {path.description ? (
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm">{path.description}</p>
            ) : null}
          </div>
          <PublishPathButton pathId={path.id} state={path.publication_state} />
        </div>
        {progress ? (
          <div className="flex items-center gap-3">
            <Progress value={progress.percent_complete} className="max-w-sm" />
            <span className="text-muted-foreground shrink-0 text-xs">
              {progress.completed_items}/{progress.total_items} items · {progress.percent_complete}%
            </span>
          </div>
        ) : null}
      </header>

      {modules.length === 0 ? (
        <EmptyState
          title="No modules yet"
          description="Authors add modules to structure the path."
        />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
          <nav aria-label="Path contents" className="flex flex-col gap-3">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                selected={selected}
                onSelect={setSelected}
              />
            ))}
          </nav>
          <ContentPanel
            pathId={path.id}
            pathModules={modules}
            selection={selected ?? firstSelection(modules)}
          />
        </div>
      )}

      <AuthorTools pathId={path.id} modules={modules} />
    </div>
  );
}

type Selection =
  | { kind: "lesson"; moduleId: number; lessonId: number }
  | { kind: "assignment"; moduleId: number; assignmentId: number };

function firstSelection(modules: LearningModule[]): Selection | null {
  for (const mod of modules) {
    if (mod.lessons[0]) return { kind: "lesson", moduleId: mod.id, lessonId: mod.lessons[0].id };
    if (mod.assignments[0]) return { kind: "assignment", moduleId: mod.id, assignmentId: mod.assignments[0].id };
  }
  return null;
}

function PublishPathButton({ pathId, state }: { pathId: number; state: string }) {
  const { hasCapability } = useSession();
  const queryClient = useQueryClient();
  const publish = useMutation({
    mutationFn: () => setPathState(pathId, "PUBLISHED"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning"] });
      toast.success("Path published.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not publish."),
  });

  if (state === "PUBLISHED" || !hasCapability("manage_content")) return null;
  return (
    <Button onClick={() => publish.mutate()} disabled={publish.isPending}>
      Publish path
    </Button>
  );
}

function ModuleCard({
  module,
  selected,
  onSelect,
}: {
  module: LearningModule;
  selected: Selection | null;
  onSelect: (selection: Selection) => void;
}) {
  const [open, setOpen] = useState(true);
  const { hasCapability } = useSession();
  const queryClient = useQueryClient();
  const canManage = hasCapability("manage_content");
  const publish = async (fn: () => Promise<unknown>, label: string) => {
    try {
      await fn();
      queryClient.invalidateQueries({ queryKey: ["learning"] });
      toast.success(`${label} published.`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not publish.");
    }
  };

  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="hover:bg-accent/50 flex w-full items-center gap-3 p-4 text-left transition-colors"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{module.title}</p>
          <p className="text-muted-foreground text-xs">
            {module.lessons.length} lessons · {module.assignments.length} assignments
          </p>
        </div>
        {module.publication_state === "DRAFT" ? (
          canManage ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                void publish(() => setModuleState(module.id, "PUBLISHED"), module.title);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.stopPropagation();
                  void publish(() => setModuleState(module.id, "PUBLISHED"), module.title);
                }
              }}
              className="text-primary rounded px-1.5 py-0.5 text-[10px] font-semibold hover:underline"
            >
              Publish
            </span>
          ) : (
            <Badge variant="warning">Draft</Badge>
          )
        ) : null}
      </button>
      {open ? (
        <ul className="border-t">
          {module.lessons.map((lesson) => (
            <TreeItem
              key={lesson.id}
              active={selected?.kind === "lesson" && selected.lessonId === lesson.id}
              draft={lesson.publication_state === "DRAFT"}
              icon={lesson.publication_state === "PUBLISHED" ? FileTextIcon : LockIcon}
              label={lesson.title}
              onClick={() => onSelect({ kind: "lesson", moduleId: module.id, lessonId: lesson.id })}
              onPublish={
                canManage && lesson.publication_state === "DRAFT"
                  ? () => publish(() => setLessonState(lesson.id, "PUBLISHED"), lesson.title)
                  : undefined
              }
            />
          ))}
          {module.assignments.map((assignment) => (
            <TreeItem
              key={assignment.id}
              active={selected?.kind === "assignment" && selected.assignmentId === assignment.id}
              draft={assignment.publication_state === "DRAFT"}
              icon={ListChecksIcon}
              label={assignment.title}
              onClick={() =>
                onSelect({ kind: "assignment", moduleId: module.id, assignmentId: assignment.id })
              }
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function TreeItem({
  active,
  draft,
  icon: Icon,
  label,
  onClick,
  onPublish,
}: {
  active: boolean;
  draft: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  onPublish?: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "true" : undefined}
        className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors ${
          active ? "bg-sidebar-accent font-medium" : "hover:bg-accent/50 text-muted-foreground"
        }`}
      >
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {draft ? <Badge variant="warning" className="text-[10px]">Draft</Badge> : null}
          {draft && onPublish ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onPublish();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.stopPropagation();
                  onPublish();
                }
              }}
              className="text-primary rounded px-1.5 py-0.5 text-[10px] font-semibold hover:underline"
            >
              Publish
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

function ContentPanel({
  pathId,
  pathModules,
  selection,
}: {
  pathId: number;
  pathModules: LearningModule[];
  selection: Selection | null;
}) {
  if (!selection) {
    return <EmptyState title="Select a lesson or assignment" className="h-fit" />;
  }
  const mod = pathModules.find((item) => item.id === selection.moduleId);
  if (!mod) return null;
  if (selection.kind === "lesson") {
    const lesson = mod.lessons.find((item) => item.id === selection.lessonId);
    return lesson ? (
      <LessonPanel key={lesson.id} pathId={pathId} lesson={lesson} />
    ) : null;
  }
  if (selection.kind === "assignment") {
    const assignment = mod.assignments.find((item) => item.id === selection.assignmentId);
    return assignment ? <AssignmentPanel key={assignment.id} assignment={assignment} /> : null;
  }
}

function LessonPanel({
  pathId,
  lesson,
}: {
  pathId: number;
  lesson: LearningLesson;
}) {
  const queryClient = useQueryClient();
  const complete = useMutation({
    mutationFn: () => completeLesson(lesson.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning", "progress", String(pathId)] });
      toast.success("Lesson completed.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not mark complete."),
  });

  return (
    <article className="bg-card flex flex-col gap-5 rounded-xl border p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{lesson.title}</h2>
        <CompleteButton completed={complete.isSuccess} onClick={() => complete.mutate()} disabled={complete.isPending} />
      </div>
      {lesson.resources.length === 0 ? (
        <p className="text-muted-foreground text-sm">No materials in this lesson yet.</p>
      ) : (
        lesson.resources.map((resource) => (
          <section key={resource.id} className="flex flex-col gap-2">
            <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {resource.title}
            </h3>
            {resource.publication_state === "DRAFT" ? (
              <ResourcePublishButton resource={resource} />
            ) : null}
            {resource.resource_type === "MARKDOWN" ? (
              <Markdown source={resource.content ?? ""} />
            ) : (
              <a
                href={resource.external_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="border-input hover:bg-accent inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
              >
                <ExternalLinkIcon className="size-4" />
                {resource.external_url}
              </a>
            )}
          </section>
        ))
      )}
    </article>
  );
}

function ResourcePublishButton({ resource }: { resource: LearningLesson["resources"][number] }) {
  const { hasCapability } = useSession();
  const queryClient = useQueryClient();
  if (!hasCapability("manage_content")) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-fit"
      onClick={async () => {
        try {
          await setResourceState(resource.id, "PUBLISHED");
          queryClient.invalidateQueries({ queryKey: ["learning"] });
          toast.success("Resource published.");
        } catch (error) {
          toast.error(error instanceof ApiError ? error.message : "Could not publish.");
        }
      }}
    >
      Publish resource
    </Button>
  );
}

function CompleteButton({
  completed,
  onClick,
  disabled,
}: {
  completed: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  if (completed) {
    return (
      <span className="text-success flex items-center gap-1.5 text-sm font-medium">
        <CheckCircle2Icon className="size-4" /> Completed
      </span>
    );
  }
  return (
    <Button size="sm" onClick={onClick} disabled={disabled}>
      <CircleIcon className="size-3.5" /> Mark complete
    </Button>
  );
}

function AuthorTools({ pathId, modules }: { pathId: number; modules: LearningModule[] }) {
  const { hasCapability } = useSession();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const author = useAuthorActions(() => setDialog(null));

  if (!hasCapability("manage_content")) return null;

  const actions = [
    { id: "module", label: "Add module" },
    { id: "lesson", label: "Add lesson", disabled: modules.length === 0 },
    { id: "resource", label: "Add resource", disabled: modules.length === 0 },
    { id: "assignment", label: "Add assignment", disabled: modules.length === 0 },
  ];

  return (
    <section aria-label="Author tools" className="border-t pt-4">
      <div className="flex flex-wrap gap-2">
        <span className="text-muted-foreground mr-2 self-center text-xs font-medium uppercase tracking-wide">
          Author tools
        </span>
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            disabled={action.disabled}
            onClick={() => setDialog(action.id as DialogKind)}
          >
            <PlusIcon /> {action.label}
          </Button>
        ))}
      </div>
      <AuthorDialog
        kind={dialog}
        pathId={pathId}
        modules={modules}
        author={author}
        onClose={() => setDialog(null)}
      />
    </section>
  );
}
