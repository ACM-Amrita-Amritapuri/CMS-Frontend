import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlusIcon } from "lucide-react";
import { z } from "zod";

import { createAccount } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/errors";
import { parseForm } from "@/lib/form-validation";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
import { AdminShell } from "@/components/admin/admin-shell";
import { TemporaryPasswordDialog } from "@/pages/admin/AdminMembersPage";

const accountSchema = z.object({
  username: z
    .string()
    .min(3, "Use at least 3 characters.")
    .regex(/^[a-zA-Z0-9._-]+$/, "Letters, digits, dots, hyphens, and underscores only."),
  roll_number: z.string().min(1, "Enter the roll number."),
});

export default function AdminAccountsPage() {
  useDocumentTitle("Accounts");
  const [username, setUsername] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [secret, setSecret] = useState<{ username: string; password: string } | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      setFormError(null);
      const values = parseForm(
        accountSchema,
        { username, roll_number: rollNumber },
        (_field, message) => setFormError(message),
      );
      if (!values) return null;
      return createAccount(values);
    },
    onSuccess: (result) => {
      if (!result) return;
      setSecret({ username: result.user.username, password: result.temporary_password });
      setUsername("");
      setRollNumber("");
    },
    onError: (error) => {
      if (error instanceof ApiError) setFormError(error.message);
      else toast.error("Could not create the account.");
    },
  });

  return (
    <AdminShell>
      <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
        <PageHeader
          title="Accounts"
        />

        <Card className="w-full max-w-3xl overflow-hidden shadow-sm">
          <CardHeader className="gap-4 border-b bg-muted/20 px-6 py-6 sm:px-8">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                <UserPlusIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base">New account</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 py-6 sm:px-8">
            <form
              className="flex flex-col gap-6"
              onSubmit={(event) => {
                event.preventDefault();
                create.mutate();
              }}
              noValidate
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Username" htmlFor="new-username" error={formError ?? undefined}>
                  <Input
                    id="new-username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="e.g. aarav.rao"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Roll number" htmlFor="new-roll-number">
                  <Input
                    id="new-roll-number"
                    value={rollNumber}
                    onChange={(event) => setRollNumber(event.target.value)}
                    placeholder="e.g. B24110"
                    className="font-mono"
                    autoComplete="off"
                  />
                </Field>
              </div>
              <div className="flex justify-end border-t pt-5">
                <Button type="submit" disabled={create.isPending} className="w-full shrink-0 sm:w-auto">
                  Create account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <TemporaryPasswordDialog
          username={secret?.username ?? ""}
          password={secret?.password ?? null}
          onClose={() => setSecret(null)}
        />
      </div>
    </AdminShell>
  );
}
