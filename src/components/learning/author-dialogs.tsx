import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createAssignment,
  createLesson,
  createModule,
  createResource,
  type LearningLesson,
  type LearningModule,
} from "@/lib/api/learning";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api/errors";
import { slugify } from "@/lib/formatters/slug";
import { localInputToIso } from "@/lib/formatters/date";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Author dialogs for every hierarchy level. Each dialog posts to the matching
 * endpoint and refreshes the whole path tree on success.
 */
export function useAuthorActions(onDone: () => void) {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.learning.all });
    onDone();
  };

  const fail = (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : "The request failed.");

  return {
    refresh,
    fail,
  };
}

export type DialogKind =
  | "module"
  | "lesson"
  | "resource"
  | "assignment"
  | null;

export function AuthorDialog({
  kind,
  pathId,
  modules,
  author,
  onClose,
}: {
  kind: DialogKind;
  pathId: number;
  modules: LearningModule[];
  author: ReturnType<typeof useAuthorActions>;
  onClose: () => void;
}) {
  if (!kind) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="capitalize">Add {kind}</DialogTitle>
        </DialogHeader>
        {kind === "module" ? <ModuleForm pathId={pathId} position={modules.length + 1} author={author} /> : null}
        {kind === "lesson" ? <LessonForm modules={modules} author={author} /> : null}
        {kind === "resource" ? <ResourceForm modules={modules} author={author} /> : null}
        {kind === "assignment" ? <AssignmentForm modules={modules} author={author} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function DialogActions({ pending }: { pending: boolean }) {
  return (
    <DialogFooter>
      <Button type="submit" disabled={pending}>
        Save
      </Button>
    </DialogFooter>
  );
}

function ModuleForm({
  pathId,
  position,
  author,
}: {
  pathId: number;
  position: number;
  author: ReturnType<typeof useAuthorActions>;
}) {
  const [title, setTitle] = useState("");
  const save = useMutation({
    mutationFn: () =>
      createModule(pathId, { title, slug: slugify(title), position }),
    onSuccess: () => {
      toast.success("Module added.");
      author.refresh();
    },
    onError: author.fail,
  });
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <Field label="Title" htmlFor="m-title">
        <Input id="m-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <DialogActions pending={save.isPending} />
    </form>
  );
}

function LessonForm({ modules, author }: { modules: LearningModule[]; author: ReturnType<typeof useAuthorActions> }) {
  const [moduleId, setModuleId] = useState(String(modules[0]?.id ?? ""));
  const [title, setTitle] = useState("");
  const selectedModule = modules.find((item) => String(item.id) === moduleId);
  const save = useMutation({
    mutationFn: () =>
      createLesson(Number(moduleId), {
        title,
        slug: slugify(title),
        position: (selectedModule?.lessons.length ?? 0) + 1,
      }),
    onSuccess: () => {
      toast.success("Lesson added.");
      author.refresh();
    },
    onError: author.fail,
  });
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <ModuleSelect modules={modules} moduleId={moduleId} onModuleChange={setModuleId} />
      <Field label="Title" htmlFor="l-title">
        <Input id="l-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <DialogActions pending={save.isPending} />
    </form>
  );
}

function ResourceForm({ modules, author }: { modules: LearningModule[]; author: ReturnType<typeof useAuthorActions> }) {
  const [moduleId, setModuleId] = useState(String(modules[0]?.id ?? ""));
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"MARKDOWN" | "EXTERNAL_LINK">("MARKDOWN");
  const [content, setContent] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const parentModule = modules.find((item) => String(item.id) === moduleId);
  const lessons = parentModule?.lessons ?? [];
  const effectiveLessonId = lessonId || String(lessons[0]?.id ?? "");
  const selectedLesson = lessons.find((item) => String(item.id) === effectiveLessonId);

  const save = useMutation({
    mutationFn: () =>
      createResource(Number(effectiveLessonId), {
        title,
        resource_type: type,
        position: (selectedLesson?.resources.length ?? 0) + 1,
        ...(type === "MARKDOWN" ? { content } : { external_url: externalUrl }),
      }),
    onSuccess: () => {
      toast.success("Resource added.");
      author.refresh();
    },
    onError: author.fail,
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <ModuleSelect modules={modules} moduleId={moduleId} onModuleChange={(value) => { setModuleId(value); setLessonId(""); }} />
      <LessonSelect lessons={lessons} lessonId={effectiveLessonId} onLessonChange={setLessonId} />
      <Field label="Title" htmlFor="r-title">
        <Input id="r-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <Field label="Type" htmlFor="r-type">
        <NativeSelect
          id="r-type"
          value={type}
          onChange={(e) => setType(e.target.value as "MARKDOWN" | "EXTERNAL_LINK")}
        >
          <option value="MARKDOWN">Markdown</option>
          <option value="EXTERNAL_LINK">External link</option>
        </NativeSelect>
      </Field>
      {type === "MARKDOWN" ? (
        <Field label="Content" htmlFor="r-content">
          <Textarea id="r-content" rows={6} value={content} onChange={(e) => setContent(e.target.value)} required />
        </Field>
      ) : (
        <Field label="External URL" htmlFor="r-url" hint="Must start with http:// or https://">
          <Input id="r-url" type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} required />
        </Field>
      )}
      <DialogActions pending={save.isPending} />
    </form>
  );
}

function AssignmentForm({ modules, author }: { modules: LearningModule[]; author: ReturnType<typeof useAuthorActions> }) {
  const [moduleId, setModuleId] = useState(String(modules[0]?.id ?? ""));
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [type, setType] = useState<"TEXT" | "LINK">("TEXT");
  const [deadline, setDeadline] = useState("");
  const selectedModule = modules.find((item) => String(item.id) === moduleId);

  const save = useMutation({
    mutationFn: () =>
      createAssignment(Number(moduleId), {
        title,
        instructions,
        assignment_type: type,
        position: (selectedModule?.assignments.length ?? 0) + 1,
        deadline_at: localInputToIso(deadline),
      }),
    onSuccess: () => {
      toast.success("Assignment added as a draft.");
      author.refresh();
    },
    onError: author.fail,
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <ModuleSelect modules={modules} moduleId={moduleId} onModuleChange={setModuleId} />
      <Field label="Title" htmlFor="a-title">
        <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <Field label="Instructions" htmlFor="a-instructions">
        <Textarea id="a-instructions" rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} required />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Submission type" htmlFor="a-type">
          <NativeSelect id="a-type" value={type} onChange={(e) => setType(e.target.value as "TEXT" | "LINK")}>
            <option value="TEXT">Text</option>
            <option value="LINK">Link</option>
          </NativeSelect>
        </Field>
        <Field label="Deadline (optional)" htmlFor="a-deadline">
          <Input id="a-deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
      </div>
      <DialogActions pending={save.isPending} />
    </form>
  );
}

function ModuleSelect({
  modules,
  moduleId,
  onModuleChange,
}: {
  modules: LearningModule[];
  moduleId: string;
  onModuleChange: (value: string) => void;
}) {
  return (
    <Field label="Module" htmlFor="sel-module">
      <NativeSelect
        id="sel-module"
        value={moduleId}
        onChange={(e) => onModuleChange(e.target.value)}
      >
        {modules.map((module) => (
          <option key={module.id} value={String(module.id)}>
            {module.title}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );
}

function LessonSelect({
  lessons,
  lessonId,
  onLessonChange,
}: {
  lessons: LearningLesson[];
  lessonId: string;
  onLessonChange: (value: string) => void;
}) {
  return (
    <Field label="Lesson" htmlFor="sel-lesson">
      <NativeSelect
        id="sel-lesson"
        value={lessonId}
        onChange={(e) => onLessonChange(e.target.value)}
      >
        {lessons.map((lesson) => (
          <option key={lesson.id} value={String(lesson.id)}>
            {lesson.title}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );
}
