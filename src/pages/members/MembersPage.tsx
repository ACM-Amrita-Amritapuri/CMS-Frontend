import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";

import { getMemberByRoll } from "@/lib/api/members";
import { queryKeys } from "@/lib/query-keys";
import { ProfileCard } from "@/components/member/profile-card";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { QueryState } from "@/components/ui/async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page";

export default function MembersPage() {
  useDocumentTitle("Members");
  const navigate = useNavigate();
  const [rollNumber, setRollNumber] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const query = useQuery({
    queryKey: queryKeys.member(submitted),
    queryFn: ({ signal }) => getMemberByRoll(submitted!, signal),
    enabled: Boolean(submitted),
    retry: false,
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        title="Members"
        description="Look up a club member by their roll number."
      />

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

      {submitted ? (
        <QueryState query={query} notFound={`No member found for “${submitted}”`}>
          {(profile) => (
            <ProfileCard
              profile={profile}
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/portfolio/${profile.user_id}`)}
                >
                  View portfolio
                </Button>
              }
            />
          )}
        </QueryState>
      ) : null}
    </div>
  );
}
