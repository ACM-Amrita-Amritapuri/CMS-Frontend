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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";
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
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <PageHeader
        title="Accounts"
        description="Create club accounts. Members change their temporary password at first sign-in."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlusIcon className="size-4" /> New account
          </CardTitle>
          <CardDescription>
            A one-time temporary password is generated on creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate();
            }}
            noValidate
          >
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
            <Button type="submit" disabled={create.isPending} className="self-start">
              Create account
            </Button>
          </form>
        </CardContent>
      </Card>

      <TemporaryPasswordDialog
        username={secret?.username ?? ""}
        password={secret?.password ?? null}
        onClose={() => setSecret(null)}
      />
    </div>
  );
}
