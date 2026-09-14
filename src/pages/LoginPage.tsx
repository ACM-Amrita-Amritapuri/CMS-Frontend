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

const loginSchema = z.object({
  login: z.string().min(1, "Enter your username or roll number."),
  password: z.string().min(1, "Enter your password."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  useDocumentTitle("Login");
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginForm>({ defaultValues: { login: "", password: "" } });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    const data = parseForm(loginSchema, values, (field, message) =>
      form.setError(field as keyof LoginForm, { message }),
    );
    if (!data) return;
    return login(data).then(
      (response) => {
        sessionStore.setSession(response.user, response.access_token);
        navigate(
          response.user.must_change_password ? "/change-password" : "/dashboard",
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
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-8 sm:px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <Link to="/login" className="flex flex-col items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl text-3xl font-extrabold shadow-lg" aria-label="ACM logo">
            A
          </span>
          <span className="text-2xl tracking-tight">ACM CMS</span>
        </Link>

        <section className="w-full rounded-2xl border bg-card p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.35)] sm:p-8">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="text-muted-foreground mt-1 text-center text-sm">
            Accounts are created by club administrators.
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
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
            <Button type="submit" disabled={form.formState.isSubmitting} className="mt-1 h-10 w-full rounded-full">
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
