import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowRightIcon, GraduationCapIcon, Loader2Icon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
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

const highlights = [
  { icon: GraduationCapIcon, text: "Structured learning paths for every SIG" },
  { icon: SparklesIcon, text: "Showcase projects and grow your portfolio" },
  { icon: ShieldCheckIcon, text: "One workspace for the whole club" },
];

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
          error instanceof ApiError
            ? error.message
            : "Could not sign in. Please try again.",
        );
      },
    );
  });

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-8 sm:px-6">
      <div className="relative grid w-full max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-20">
        <section className="hidden flex-col gap-7 lg:flex">
          <Brand />
          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.18em]">
            ACM student community
          </p>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance xl:text-5xl">
            The club workspace for learning, building, and running ACM.
          </h1>
          <p className="text-muted-foreground max-w-lg text-sm leading-6">
            Keep your learning paths, projects, events, and club knowledge in one focused workspace.
          </p>
          <ul className="flex flex-col gap-3">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="text-muted-foreground flex items-center gap-3 text-sm">
                <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-card rounded-2xl border p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)] sm:p-8 dark:shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
          <div className="mb-6 lg:hidden">
            <Brand />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="text-muted-foreground mt-1 text-sm">
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

          <p className="text-muted-foreground mt-6 text-center text-xs">
            Trouble signing in? Ask an administrator to reset your password.
          </p>
        </section>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/login" className="flex items-center gap-2.5 font-semibold">
      <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded text-base font-bold">
        A
      </span>
      <span className="text-lg">ACM CMS</span>
    </Link>
  );
}
