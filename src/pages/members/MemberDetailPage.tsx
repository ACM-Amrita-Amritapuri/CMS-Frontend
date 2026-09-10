import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { UsersIcon } from "lucide-react";

import { getMemberByRoll } from "@/lib/api/members";
import { ProfileCard } from "@/components/member/profile-card";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { EmptyState } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/primitives";

export default function MemberDetailPage() {
  useDocumentTitle("Member");
  const { rollNumber } = useParams();
  const query = useQuery({
    queryKey: ["member", rollNumber],
    queryFn: () => getMemberByRoll(decodeURIComponent(rollNumber ?? "")),
    retry: false,
  });

  if (query.isPending) {
    return <Skeleton className="h-72 w-full max-w-2xl" />;
  }
  if (query.isError) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Member not found"
        description="This roll number doesn't match any club member."
      />
    );
  }

  return <ProfileCard profile={query.data} />;
}
