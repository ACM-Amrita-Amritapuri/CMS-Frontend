import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getMemberByRoll } from "@/lib/api/members";
import { queryKeys } from "@/lib/query-keys";
import { ProfileCard } from "@/components/member/profile-card";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { QueryState } from "@/components/ui/async";
import { Skeleton } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page";

export default function MemberDetailPage() {
  useDocumentTitle("Member");
  const { rollNumber } = useParams();
  const query = useQuery({
    queryKey: queryKeys.member(rollNumber),
    queryFn: ({ signal }) => getMemberByRoll(rollNumber ?? "", signal),
    retry: false,
  });

  return (
    <QueryState
      query={query}
      notFound="Member not found"
      skeleton={<Skeleton className="mx-auto h-72 w-full max-w-2xl" />}
    >
      {(profile) => (
        <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-6">
          <PageHeader
            title={profile.real_name || profile.username}
            description="Member profile and club details."
            backTo={{ label: "Back to members", to: "/members" }}
          />
          <ProfileCard profile={profile} />
        </div>
      )}
    </QueryState>
  );
}
