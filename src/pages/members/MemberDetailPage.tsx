import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { UsersIcon } from "lucide-react";

import { getMemberByRoll } from "@/lib/api/members";
import { ProfileCard } from "@/components/member/profile-card";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { EmptyState } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/page";

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

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader
        title={query.data.real_name || query.data.username}
        description="Member profile and club details."
        backTo={{ label: "Back to members", to: "/members" }}
      />
      <ProfileCard profile={query.data} />
    </div>
  );
}
