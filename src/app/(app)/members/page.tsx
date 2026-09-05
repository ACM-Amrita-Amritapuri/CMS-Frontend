"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, UsersIcon } from "lucide-react";

import { getMemberByRoll } from "@/lib/api/members";
import { ProfileCard } from "@/components/member/profile-card";
import { EmptyState } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MembersPage() {
  const router = useRouter();
  const [rollNumber, setRollNumber] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["member", submitted],
    queryFn: () => getMemberByRoll(submitted!),
    enabled: Boolean(submitted),
    retry: false,
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Look up a club member by their roll number.
        </p>
      </header>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(rollNumber.trim() || null);
        }}
      >
        <Input
          value={rollNumber}
          onChange={(event) => setRollNumber(event.target.value)}
          placeholder="Roll number, e.g. B123"
          aria-label="Roll number"
        />
        <Button type="submit" disabled={!rollNumber.trim()}>
          <SearchIcon /> Search
        </Button>
      </form>

      {submitted && query.isError ? (
        <EmptyState
          icon={UsersIcon}
          title={`No member found for “${submitted}”`}
          description="Check the roll number and try again."
        />
      ) : null}

      {submitted && query.data ? (
        <ProfileCard
          profile={query.data}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/portfolio/${query.data.user_id}`)}
            >
              View portfolio
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
