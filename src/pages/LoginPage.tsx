import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";
import { z } from "zod";

import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { parseForm } from "@/lib/form-validation";
import { sessionStore } from "@/lib/auth/session-store";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme";
import fullLogoUrl from "@/assets/acm-student-chapter-full-logo.webp";
import darkLogoUrl from "@/assets/acm-student-chapter-full-logo-dark.webp";

const loginSchema = z.object({
  login: z.string().min(1, "Enter your username or roll number."),
  password: z.string().min(1, "Enter your password."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  useDocumentTitle("Login");
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginForm>({ defaultValues: { login: "", password: "" } });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    form.clearErrors("root");
    const data = parseForm(loginSchema, values, (field, message) =>
      form.setError(field as keyof LoginForm, { message }),
    );
    if (!data) return;
    return login(data).then(
      (response) => {
        sessionStore.setSession(response.user, response.access_token);
        navigate(
          response.user.must_change_password
            ? "/change-password"
            : response.user.profile_complete === false
              ? "/profile/setup"
              : "/dashboard",
          { replace: true },
        );
      },
      (error: unknown) => {
        setFormError(
          error instanceof ApiError ? error.message : "Could not sign in. Please try again.",
        );
      },
    );
  });

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-6 sm:px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Link to="/login" className="flex w-full justify-center font-semibold">
          <img
            src={resolvedTheme === "dark" ? darkLogoUrl : fullLogoUrl}
            alt="ACM Student Chapter"
            decoding="async"
            className="h-auto w-full max-w-[20rem] object-contain"
          />
        </Link>

        <section className="w-full rounded-xl border bg-card p-5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.35)] sm:p-6">
          <h1 className="text-center text-xl font-semibold tracking-tight">Sign in</h1>

          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4" noValidate>
            {form.formState.errors.root?.message ? (
              <p role="alert" className="text-destructive text-sm font-medium">{form.formState.errors.root.message}</p>
            ) : null}
            <Field
              label="Username or roll number"
              htmlFor="login"
              error={form.formState.errors.login?.message}
            >
              <Input id="login" autoComplete="username" autoFocus {...form.register("login")} />
            </Field>
            <Field
              label="Password"
              htmlFor="password"
              error={form.formState.errors.password?.message}
            >
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...form.register("password")}
              />
            </Field>
            {formError ? (
              <p role="alert" className="text-destructive text-sm font-medium">
                {formError}
              </p>
            ) : null}
            <Button type="submit" disabled={form.formState.isSubmitting} className="mt-1 min-h-10 w-full rounded-2xl">
              {form.formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
              <span>Sign in</span>
              {!form.formState.isSubmitting ? <ArrowRightIcon /> : null}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
