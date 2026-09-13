import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CheckIcon,
  FlagIcon,
  PlusIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

import {
  applyToRole,
  createMilestone,
  createRole,
  createTask,
  getProject,
  leaveProject,
  reviewApplication,
  updateTask,
  upsertShowcase,
  type Project,
  type ProjectApplication,
  type ProjectMembership,
  type ProjectMilestone,
  type ProjectRole,
  type ProjectTask,
} from "@/lib/api/projects";
import { ApiError } from "@/lib/api/errors";
import { useSession } from "@/app/providers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { QueryErrorState } from "@/components/ui/async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { Progress } from "@/components/ui/primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/table";

const taskStates = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const;

export default function ProjectDetailPage() {
  useDocumentTitle("Project");
  const { projectId } = useParams();
  const id = Number(projectId);
  const invalidId = !projectId || Number.isNaN(id);
  const query = useQuery({
    queryKey: ["projects", "detail", invalidId ? projectId : id],
    queryFn: () => getProject(id),
    retry: false,
    enabled: !invalidId,
  });

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/projects">
          <ArrowLeftIcon /> All projects
        </Link>
      </Button>
      {invalidId ? (
        <EmptyState title="Project not found" description="This project does not exist." />
      ) : query.isPending ? (
        <div className="bg-muted h-64 animate-pulse rounded-lg" />
      ) : query.isError ? (
        <QueryErrorState error={query.error} retry={() => query.refetch()} />
      ) : (
        <ProjectDetail project={query.data} />
      )}
    </div>
  );
}

function ProjectDetail({ project }: { project: Project }) {
  const { user } = useSession();
  const isLead = user?.id === project.lead_user_id;
  const activeMemberships = project.team_memberships.filter((membership) => !membership.left_at);
  const myMembership = activeMemberships.find(
    (membership) => membership.member_user_id === user?.id,
  );
  const myApplication = project.applications.find(
    (application) => application.applicant_user_id === user?.id,
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm">{project.summary}</p>
          </div>
          <div className="text-right">
            <Badge variant={project.state === "PUBLISHED" ? "success" : "secondary"}>
              {project.state.toLowerCase()}
            </Badge>
            <p className="text-muted-foreground mt-1 text-xs">
              Lead: user #{project.lead_user_id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={project.progress} className="max-w-xs" />
          <span className="text-muted-foreground text-xs tabular-nums">{project.progress}%</span>
        </div>
      </header>

      <Tabs defaultValue="about">
        <TabsList>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="team">
            Team ({activeMemberships.length}/{project.team_capacity})
          </TabsTrigger>
          <TabsTrigger value="work">Work</TabsTrigger>
        </TabsList>

      <TabsContent value="about" className="bg-card rounded-lg border p-6">
          <Markdown source={project.description} />
        </TabsContent>

        <TabsContent value="team" className="flex flex-col gap-4">
          <RolesSection
            project={project}
            isLead={isLead}
            myMembership={myMembership}
            myApplication={myApplication}
          />
          <ApplicationsSection project={project} isLead={isLead} />
          {myMembership ? <LeaveButton projectId={project.id} /> : null}
        </TabsContent>

        <TabsContent value="work" className="flex flex-col gap-4">
          <TasksSection project={project} canWork={isLead || Boolean(myMembership)} />
          <MilestonesSection projectId={project.id} canWork={isLead || Boolean(myMembership)} />
        </TabsContent>
      </Tabs>

      {isLead ? <ShowcaseSection project={project} /> : null}
    </div>
  );
}

function RolesSection({
  project,
  isLead,
  myMembership,
  myApplication,
}: {
  project: Project;
  isLead: boolean;
  myMembership?: ProjectMembership;
  myApplication?: ProjectApplication;
}) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [skills, setSkills] = useState("");

  const apply = useMutation({
    mutationFn: (roleId: number) => applyToRole(project.id, { role_id: roleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "detail", project.id] });
      toast.success("Application sent.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not apply."),
  });

  const create = useMutation({
    mutationFn: () =>
      createRole(project.id, {
        title,
        description,
        capacity: Number(capacity),
        required_skills: skills.split(",").map((skill) => skill.trim().toLowerCase()).filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setCreating(false);
      toast.success("Role added.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not add the role."),
  });

  const roleCounts = (roleId: number) =>
    project.team_memberships.filter((membership) => membership.role_id === roleId && !membership.left_at).length;

  return (
    <section className="bg-card rounded-lg border p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Open roles</h2>
        {isLead ? (
          <Button variant="outline" size="sm" onClick={() => setCreating((value) => !value)}>
            <PlusIcon /> Add role
          </Button>
        ) : null}
      </div>

      {creating ? (
        <form
          className="mt-4 grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <Field label="Title" htmlFor="role-title">
            <Input id="role-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </Field>
          <Field label="Capacity" htmlFor="role-capacity">
            <Input id="role-capacity" type="number" min={1} value={capacity} onChange={(event) => setCapacity(event.target.value)} required />
          </Field>
          <Field label="Description" htmlFor="role-description" className="sm:col-span-2">
            <Input id="role-description" value={description} onChange={(event) => setDescription(event.target.value)} required />
          </Field>
          <Field label="Required skills" htmlFor="role-skills" hint="Comma-separated." className="sm:col-span-2">
            <Input id="role-skills" value={skills} onChange={(event) => setSkills(event.target.value)} />
          </Field>
          <Button type="submit" className="w-fit" disabled={create.isPending}>
            Add role
          </Button>
        </form>
      ) : null}

      {project.roles.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">No roles defined yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {project.roles.map((role: ProjectRole) => {
            const filled = roleCounts(role.id);
            const canApply = !isLead && !myMembership && !myApplication && filled < role.capacity;
            return (
              <li key={role.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{role.title}</p>
                  <p className="text-muted-foreground text-xs">{role.description}</p>
                  {role.required_skills.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {role.required_skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-[10px]">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Badge variant={filled >= role.capacity ? "secondary" : "outline"}>
                  {filled}/{role.capacity}
                </Badge>
                {canApply ? (
                  <Button size="sm" onClick={() => apply.mutate(role.id)}>
                    <UserPlusIcon /> Apply
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {myApplication ? (
        <p className="text-muted-foreground mt-3 text-xs">
          Your application is {myApplication.state.toLowerCase()}.
        </p>
      ) : null}
    </section>
  );
}

function ApplicationsSection({ project, isLead }: { project: Project; isLead: boolean }) {
  const queryClient = useQueryClient();
  const review = useMutation({
    mutationFn: ({ applicationId, decision }: { applicationId: number; decision: "ACCEPT" | "REJECT" }) =>
      reviewApplication(applicationId, decision),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(`Application ${result.state.toLowerCase()}.`);
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not review."),
  });

  const pending = project.applications.filter((application) => application.state === "PENDING");
  if (!isLead || pending.length === 0) return null;

  return (
    <section className="bg-card rounded-lg border p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Pending applications</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {pending.map((application) => (
          <li key={application.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Applicant #{application.applicant_user_id}</p>
              {application.note ? (
                <p className="text-muted-foreground truncate text-xs">{application.note}</p>
              ) : null}
            </div>
            <Button
              size="sm"
              onClick={() => review.mutate({ applicationId: application.id, decision: "ACCEPT" })}
            >
              <CheckIcon /> Accept
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => review.mutate({ applicationId: application.id, decision: "REJECT" })}
            >
              Reject
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LeaveButton({ projectId }: { projectId: number }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const leave = useMutation({
    mutationFn: () => leaveProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("You left the project.");
      setConfirming(false);
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not leave."),
  });

  return (
    <div className="bg-card flex items-center justify-between gap-3 rounded-lg border p-5">
      <p className="text-sm">You are a member of this project.</p>
      {confirming ? (
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={() => leave.mutate()}>
            Confirm leave
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setConfirming(true)}>
          Leave project
        </Button>
      )}
    </div>
  );
}

function TasksSection({ project, canWork }: { project: Project; canWork: boolean }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  // The project payload does not embed tasks; created tasks accumulate here
  // within the session.
  const allTasks = tasks.filter((task) => task.project_id === project.id);

  const create = useMutation({
    mutationFn: () => createTask(project.id, { title }),
    onSuccess: (task) => {
      setTasks((current) => [...current, task]);
      setCreating(false);
      setTitle("");
      toast.success("Task created.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not create the task."),
  });

  const move = useMutation({
    mutationFn: ({ task, state }: { task: ProjectTask; state: ProjectTask["state"] }) =>
      updateTask(task.id, { state }),
    onSuccess: (updated) => {
      setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Invalid transition."),
  });

  return (
    <section className="bg-card rounded-lg border p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Tasks</h2>
        {canWork ? (
          <Button variant="outline" size="sm" onClick={() => setCreating((value) => !value)}>
            <PlusIcon /> New task
          </Button>
        ) : null}
      </div>
      {creating ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" required />
          <Button type="submit">Add</Button>
        </form>
      ) : null}
      {allTasks.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">
          Tasks created in this session appear here.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {allTasks.map((task) => (
            <li key={task.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{task.title}</p>
              <div className="flex gap-1">
                {taskStates
                  .filter((state) => state !== task.state)
                  .map((state) => (
                    <Button
                      key={state}
                      size="sm"
                      variant="ghost"
                      onClick={() => move.mutate({ task, state })}
                      disabled={move.isPending}
                    >
                      {state.toLowerCase()}
                    </Button>
                  ))}
              </div>
              <Badge variant="secondary">{task.state.toLowerCase()}</Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MilestonesSection({ projectId, canWork }: { projectId: number; canWork: boolean }) {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const create = useMutation({
    mutationFn: () => createMilestone(projectId, { title }),
    onSuccess: (milestone) => {
      setMilestones((current) => [...current, milestone]);
      setCreating(false);
      setTitle("");
      toast.success("Milestone added.");
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not add the milestone."),
  });

  const scoped = milestones.filter((milestone) => milestone.project_id === projectId);

  return (
    <section className="bg-card rounded-lg border p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          <FlagIcon className="mr-1 inline size-3.5" /> Milestones
        </h2>
        {canWork ? (
          <Button variant="outline" size="sm" onClick={() => setCreating((value) => !value)}>
            <PlusIcon /> Add
          </Button>
        ) : null}
      </div>
      {creating ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Milestone title" required />
          <Button type="submit">Add</Button>
        </form>
      ) : null}
      {scoped.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">
          Milestones added in this session appear here.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {scoped.map((milestone) => (
            <li key={milestone.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <FlagIcon className="text-primary size-4 shrink-0" />
              {milestone.title}
              <Badge variant="secondary" className="ml-auto">
                {milestone.state.toLowerCase()}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ShowcaseSection({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const [summary, setSummary] = useState("");
  const [technology, setTechnology] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");

  const save = useMutation({
    mutationFn: (state: "DRAFT" | "PUBLISHED") =>
      upsertShowcase(project.id, {
        summary,
        technology,
        outcomes,
        repository_url: repositoryUrl.trim() || null,
        state,
      }),
    onSuccess: (showcase) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      toast.success(
        showcase.state === "PUBLISHED" ? "Showcase published." : "Showcase saved as draft.",
      );
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not save the showcase."),
  });

  return (
    <section className="bg-card rounded-lg border p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
        <UsersIcon className="size-4" /> Project showcase
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Publishing adds this project to the portfolio of every team member.
      </p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate("PUBLISHED");
        }}
      >
        <Field label="Summary" htmlFor="show-summary" className="sm:col-span-2">
          <Textarea id="show-summary" rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} required />
        </Field>
        <Field label="Technology" htmlFor="show-tech">
          <Input id="show-tech" value={technology} onChange={(event) => setTechnology(event.target.value)} required />
        </Field>
        <Field label="Outcomes" htmlFor="show-outcomes">
          <Input id="show-outcomes" value={outcomes} onChange={(event) => setOutcomes(event.target.value)} required />
        </Field>
        <Field label="Repository URL (optional)" htmlFor="show-repo" className="sm:col-span-2">
          <Input id="show-repo" type="url" value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/..." />
        </Field>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={save.isPending}>
            Publish showcase
          </Button>
          <Button type="button" variant="outline" disabled={save.isPending} onClick={() => save.mutate("DRAFT")}>
            Save draft
          </Button>
        </div>
      </form>
    </section>
  );
}
