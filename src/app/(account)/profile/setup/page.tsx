"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { IdCardIcon, Loader2Icon } from "lucide-react";
import { z } from "zod";

import { getMe } from "@/lib/api/auth";
import {
  getMyProfile,
  initializeMyProfile,
  updateMyProfile,
  type ProfileInput,
} from "@/lib/api/members";
import { ApiError } from "@/lib/api/errors";
import { parseForm } from "@/lib/form-validation";
import { sessionStore } from "@/lib/auth/session-store";
import { useSession } from "@/app/providers";
import { useSessionBootstrap } from "@/components/auth/use-session-bootstrap";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { QueryErrorState } from "@/components/ui/async";

const urlField = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^https?:\/\/.+$/.test(value),
    "Enter a valid URL (including https://).",
  )
  .transform((value) => (value === "" ? null : value));

const profileSchema = z.object({
  real_name: z.string().min(1, "Enter your full name."),
  year: z.coerce.number().int().min(1, "Year must be 1–4.").max(4, "Year must be 1–4."),
  branch: z.string().min(1, "Enter your branch."),
  about: z.string().min(1, "Write a short introduction."),
  skills: z.string().min(1, "List at least one skill."),
  interests: z.string().optional().default(""),
  hobbies: z.string().optional().default(""),
  github_url: urlField,
  linkedin_url: urlField,
  leetcode_url: urlField,
  codechef_url: urlField,
  codeforces_url: urlField,
  hackerrank_url: urlField,
});

type ProfileForm = z.input<typeof profileSchema>;

const socialFields = [
  { key: "github_url", label: "GitHub URL" },
  { key: "linkedin_url", label: "LinkedIn URL" },
  { key: "leetcode_url", label: "LeetCode URL" },
  { key: "codechef_url", label: "CodeChef URL" },
  { key: "codeforces_url", label: "Codeforces URL" },
  { key: "hackerrank_url", label: "HackerRank URL" },
] as const;

function profileToForm(profile: Awaited<ReturnType<typeof getMyProfile>>): ProfileForm {
  return {
    real_name: profile.real_name ?? "",
    year: profile.year ? String(profile.year) : "",
    branch: profile.branch ?? "",
    about: profile.about ?? "",
    skills: profile.skills?.join(", ") ?? "",
    interests: profile.interests ?? "",
    hobbies: profile.hobbies ?? "",
    github_url: profile.github_url ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    leetcode_url: profile.leetcode_url ?? "",
    codechef_url: profile.codechef_url ?? "",
    codeforces_url: profile.codeforces_url ?? "",
    hackerrank_url: profile.hackerrank_url ?? "",
  };
}

function formToProfileInput(data: z.output<typeof profileSchema>): ProfileInput {
  return {
    real_name: data.real_name.trim(),
    year: data.year,
    branch: data.branch.trim(),
    about: data.about.trim(),
    skills: data.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),
    interests: data.interests?.trim() ?? "",
    hobbies: data.hobbies?.trim() ?? "",
    github_url: data.github_url,
    linkedin_url: data.linkedin_url,
    leetcode_url: data.leetcode_url,
    codechef_url: data.codechef_url,
    codeforces_url: data.codeforces_url,
    hackerrank_url: data.hackerrank_url,
  };
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const { status } = useSessionBootstrap();

  useEffect(() => {
    if (status === "signed-out") router.replace("/login");
    if (status === "password-change-required") router.replace("/change-password");
  }, [status, router]);

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMyProfile,
    enabled: status === "ready" || status === "profile-incomplete",
  });

  const { user } = useSession();
  const initMutation = useMutation({
    mutationFn: (username: string) => initializeMyProfile(username),
    onSuccess: () => profileQuery.refetch(),
  });

  // A genuinely missing profile (no record at all) passes every gate but
  // 404s here; create it once so the member can onboard.
  useEffect(() => {
    if (
      profileQuery.error instanceof ApiError &&
      profileQuery.error.status === 404 &&
      user &&
      !initMutation.isPending
    ) {
      initMutation.mutate(user.username);
    }
  }, [profileQuery.error, user, initMutation]);

  const isComplete = profileQuery.data?.is_complete === true;

  useEffect(() => {
    if (isComplete) router.replace("/dashboard");
  }, [isComplete, router]);

  const form = useForm<ProfileForm>();

  useEffect(() => {
    if (profileQuery.data && !isComplete) {
      form.reset(profileToForm(profileQuery.data));
    }
  }, [profileQuery.data, isComplete, form]);

  const saveMutation = useMutation({
    mutationFn: (input: ProfileInput) => updateMyProfile(input),
    onSuccess: async (profile) => {
      if (!profile.is_complete) {
        toast.error("The profile is still incomplete — check the required fields.");
        return;
      }
      // Re-sync the user now that /auth/me passes the profile gate.
      const user = await getMe();
      const token = sessionStore.getSnapshot().accessToken;
      if (user && token) sessionStore.setSession(user, token);
      toast.success("Profile saved.");
      router.replace("/dashboard");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 422) {
        toast.error(error.message);
      } else {
        toast.error(
          error instanceof ApiError ? error.message : "Could not save the profile.",
        );
      }
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const data = parseForm(profileSchema, values, (field, message) =>
      form.setError(field as keyof ProfileForm, { message }),
    );
    if (!data) return;
    saveMutation.mutate(formToProfileInput(data));
  });

  if (status === "loading" || profileQuery.isPending || initMutation.isPending) {
    return <div className="min-h-svh" />;
  }
  if (status === "error" || profileQuery.isError) {
    const error =
      status === "error"
        ? new Error("The session could not be verified.")
        : profileQuery.error;
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <QueryErrorState error={error} retry={() => window.location.reload()} />
      </div>
    );
  }
  if (isComplete) return null;

  const { errors } = form.formState;

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col justify-center px-4 py-10">
      <div className="bg-card rounded-2xl border p-6 shadow-lg sm:p-8">
        <div className="bg-primary/10 text-primary mb-4 flex size-11 items-center justify-center rounded-xl">
          <IdCardIcon className="size-5" />
        </div>
        <h1 className="text-xl font-semibold">Complete your profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Introduce yourself to the club. You can update this any time.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
            <Field label="Full name" htmlFor="real_name" error={errors.real_name?.message}>
              <Input id="real_name" {...form.register("real_name")} />
            </Field>
            <Field label="Year" htmlFor="year" error={errors.year?.message}>
              <Input id="year" type="number" min={1} max={4} {...form.register("year")} />
            </Field>
          </div>
          <Field label="Branch" htmlFor="branch" error={errors.branch?.message}>
            <Input id="branch" placeholder="e.g. CSE" {...form.register("branch")} />
          </Field>
          <Field label="About" htmlFor="about" error={errors.about?.message}>
            <Textarea
              id="about"
              rows={3}
              placeholder="A short introduction."
              {...form.register("about")}
            />
          </Field>
          <Field
            label="Skills"
            htmlFor="skills"
            hint="Comma-separated, e.g. Python, React, Figma."
            error={errors.skills?.message}
          >
            <Input id="skills" {...form.register("skills")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Interests" htmlFor="interests" error={errors.interests?.message}>
              <Input id="interests" {...form.register("interests")} />
            </Field>
            <Field label="Hobbies" htmlFor="hobbies" error={errors.hobbies?.message}>
              <Input id="hobbies" {...form.register("hobbies")} />
            </Field>
          </div>

          <div className="mt-2 border-t pt-4">
            <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide">
              Social & competitive profiles (optional)
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {socialFields.map(({ key, label }) => (
                <Field key={key} label={label} htmlFor={key} error={errors[key]?.message}>
                  <Input
                    id={key}
                    type="url"
                    placeholder="https://"
                    {...form.register(key)}
                  />
                </Field>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="mt-2 self-start"
          >
            {saveMutation.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Save profile
          </Button>
        </form>
      </div>
    </div>
  );
}
