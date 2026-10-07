import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2Icon, LockIcon } from "lucide-react";
import { z } from "zod";

import { changePassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { parseForm } from "@/lib/form-validation";
import { sessionStore } from "@/lib/auth/session-store";
import { useSessionBootstrap } from "@/components/auth/use-session-bootstrap";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
import { QueryErrorState } from "@/components/ui/async";

const passwordSchema = z
  .object({
    current_password: z.string().optional(),
    new_password: z.string().min(8, "Use at least 8 characters."),
    confirm_password: z.string(),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export default function ChangePasswordPage() {
  useDocumentTitle("Change password");
  const navigate = useNavigate();
  const { status, error, retry } = useSessionBootstrap();
  const form = useForm<PasswordForm>({
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });

  useEffect(() => {
    if (status === "signed-out") navigate("/login", { replace: true });
    if (status === "profile-incomplete") navigate("/profile/setup", { replace: true });
  }, [status, navigate]);

  const onSubmit = form.handleSubmit((values) => {
    form.clearErrors("root");
    const data = parseForm(passwordSchema, values, (field, message) =>
      form.setError(field as keyof PasswordForm, { message }),
    );
    if (!data) return;
    if (!mustChange && !data.current_password) {
      form.setError("current_password", { message: "Enter your current password." });
      return;
    }

    const generation = sessionStore.getGeneration();
    return changePassword({
      ...(mustChange ? {} : { current_password: data.current_password }),
      new_password: data.new_password,
    }).then(
      (response) => {
        if (!sessionStore.isCurrentGeneration(generation)) return;
        sessionStore.setSession(response.user, response.access_token);
        toast.success("Password updated.");
        navigate(
          response.user.profile_complete === false ? "/profile/setup" : "/dashboard",
          { replace: true },
        );
      },
      (error: unknown) => {
        if (!sessionStore.isCurrentGeneration(generation)) return;
        if (!mustChange && error instanceof ApiError && error.status === 401) {
          form.setError("current_password", { message: error.message });
        } else if (error instanceof ApiError && error.status === 422) {
          form.setError("new_password", { message: error.message });
        } else {
          toast.error(
            error instanceof ApiError ? error.message : "Could not update the password.",
          );
        }
      },
    );
  });

  if (status === "error") {
    return (
      <div className="flex min-h-svh items-center justify-center px-4 py-8 sm:px-6">
        <QueryErrorState error={error} retry={retry} />
      </div>
    );
  }

  if (status !== "ready" && status !== "password-change-required") {
    return <OnboardingSplash />;
  }

  const mustChange = status === "password-change-required";

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-8 sm:px-6">
      <div className="bg-card w-full min-w-0 max-w-md rounded-2xl border p-5 shadow-sm sm:p-8">
        <div className="bg-primary/10 text-primary mb-4 flex size-11 items-center justify-center rounded-md">
          <LockIcon className="size-5" />
        </div>
        <PageHeader
          title={mustChange ? "Set a new password" : "Change your password"}
          description={
            mustChange
              ? "Your account has a temporary password. Choose a new one to continue."
              : "After changing your password you'll be signed out and need to log in again."
          }
        />

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5" noValidate>
          {form.formState.errors.root?.message ? (
            <p role="alert" className="text-destructive text-sm font-medium">{form.formState.errors.root.message}</p>
          ) : null}
          {!mustChange ? (
            <Field
              label="Current password"
              htmlFor="current_password"
              error={form.formState.errors.current_password?.message}
            >
              <Input
                id="current_password"
                type="password"
                autoComplete="current-password"
                autoFocus
                {...form.register("current_password")}
              />
            </Field>
          ) : null}
          <Field
            label={mustChange ? "Reset Password" : "New password"}
            htmlFor="new_password"
            hint="At least 8 characters."
            error={form.formState.errors.new_password?.message}
          >
            <Input
              id="new_password"
              type="password"
              autoComplete="new-password"
              {...form.register("new_password")}
            />
          </Field>
          <Field
            label={mustChange ? "Confirm Reset Password" : "Confirm new password"}
            htmlFor="confirm_password"
            error={form.formState.errors.confirm_password?.message}
          >
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              {...form.register("confirm_password")}
            />
          </Field>
          <Button type="submit" disabled={form.formState.isSubmitting} className="mt-1 min-h-11 w-full">
            {form.formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {mustChange ? "Reset password" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function OnboardingSplash() {
  return <div className="min-h-svh" />;
}
