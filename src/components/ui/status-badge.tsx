import { Badge } from "@/components/ui/badge";

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "info" | "outline"> = {
  ACTIVE: "success",
  APPROVED: "info",
  ARCHIVED: "secondary",
  BLOCKED: "destructive",
  CANCELLED: "destructive",
  CLOSED: "secondary",
  DRAFT: "warning",
  DONE: "success",
  IN_PROGRESS: "info",
  INACTIVE: "secondary",
  PUBLISHED: "success",
  REJECTED: "destructive",
  REVIEWED: "success",
  SUBMITTED: "info",
  TODO: "secondary",
};

function statusLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\w/g, (letter) => letter.toUpperCase());
}

function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge className={className} variant={statusVariants[status as keyof typeof statusVariants] ?? "outline"}>
      {statusLabel(status)}
    </Badge>
  );
}

export { StatusBadge, statusLabel };
