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
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-8">
      <PageHeader
        title="Members"
        description="Look up a club member by their roll number."
      />

      <form
        className="glass flex flex-col gap-3 rounded-2xl p-2 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(rollNumber.trim() || null);
        }}
      >
        <Input
          className="h-13 border-0 bg-transparent shadow-none focus-visible:border-0 focus-visible:ring-0 sm:flex-1"
          value={rollNumber}
          onChange={(event) => setRollNumber(event.target.value)}
          placeholder="Roll number, e.g. B123"
          aria-label="Roll number"
        />
        <Button type="submit" disabled={!rollNumber.trim()} variant="secondary" className="min-h-13 w-full px-7 sm:w-auto">
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
