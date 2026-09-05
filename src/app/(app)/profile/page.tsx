"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PencilIcon } from "lucide-react";
import { z } from "zod";

import {
  getMyProfile,
  updateMyProfile,
  type ProfileInput,
} from "@/lib/api/members";
import { ApiError } from "@/lib/api/errors";
import { parseForm } from "@/lib/form-validation";
import { ProfileCard } from "@/components/member/profile-card";
import { AsyncBoundary } from "@/components/ui/async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";

const editableSchema = z.object({
  real_name: z.string().min(1, "Enter your full name."),
  year: z.coerce.number().int().min(1, "Year must be 1–4.").max(4, "Year must be 1–4."),
  branch: z.string().min(1, "Enter your branch."),
  about: z.string().min(1, "Write a short introduction."),
  skills: z.string().min(1, "List at least one skill."),
  interests: z.string(),
  hobbies: z.string(),
});

type EditableForm = z.input<typeof editableSchema>;

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const query = useQuery({ queryKey: ["profile", "me"], queryFn: getMyProfile });

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <AsyncBoundary query={query} empty={{ title: "No profile found" }}>
        {(profile) =>
          editing ? (
            <ProfileEditForm
              profile={profile}
              onDone={() => setEditing(false)}
            />
          ) : (
            <>
              <ProfileCard
                profile={profile}
                actions={
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <PencilIcon /> Edit
                  </Button>
                }
              />
            </>
          )
        }
      </AsyncBoundary>
    </div>
  );
}

function ProfileEditForm({
  profile,
  onDone,
}: {
  profile: Awaited<ReturnType<typeof getMyProfile>>;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const form = useFormState(profile);

  const save = useMutation({
    mutationFn: (input: ProfileInput) => updateMyProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated.");
      onDone();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not save the profile."),
  });

  const onSubmit = form.handleSubmit((values) => {
    const data = parseForm(editableSchema, values, (field, message) =>
      form.setError(field as keyof EditableForm, { message }),
    );
    if (!data) return;
    save.mutate({
      real_name: data.real_name.trim(),
      year: data.year,
      branch: data.branch.trim(),
      about: data.about.trim(),
      skills: data.skills.split(",").map((s) => s.trim()).filter(Boolean),
      interests: data.interests.trim(),
      hobbies: data.hobbies.trim(),
    });
  });

  const { errors } = form.formState;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
            <Field label="Full name" htmlFor="real_name" error={errors.real_name?.message}>
              <Input id="real_name" {...form.register("real_name")} />
            </Field>
            <Field label="Year" htmlFor="year" error={errors.year?.message}>
              <Input id="year" type="number" min={1} max={4} {...form.register("year")} />
            </Field>
          </div>
          <Field label="Branch" htmlFor="branch" error={errors.branch?.message}>
            <Input id="branch" {...form.register("branch")} />
          </Field>
          <Field label="About" htmlFor="about" error={errors.about?.message}>
            <Textarea id="about" rows={3} {...form.register("about")} />
          </Field>
          <Field
            label="Skills"
            htmlFor="skills"
            hint="Comma-separated."
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
          <p className="text-muted-foreground text-xs">
            Social links are managed through the onboarding profile setup.
          </p>
          <div className="flex gap-2">
            <Button type="submit" disabled={save.isPending}>
              Save changes
            </Button>
            <Button type="button" variant="ghost" onClick={onDone}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function useFormState(profile: Awaited<ReturnType<typeof getMyProfile>>) {
  return useForm<EditableForm>({
    defaultValues: {
      real_name: profile.real_name ?? "",
      year: profile.year ? String(profile.year) : "",
      branch: profile.branch ?? "",
      about: profile.about ?? "",
      skills: profile.skills?.join(", ") ?? "",
      interests: profile.interests ?? "",
      hobbies: profile.hobbies ?? "",
    },
  });
}
