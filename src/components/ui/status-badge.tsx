import { Badge } from "@/components/ui/badge";
import { CircleDashedIcon, CircleDotIcon, CircleIcon } from "lucide-react";

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
  const Icon = statusIcon(status);
  return (
    <Badge className={className} variant={statusVariants[status as keyof typeof statusVariants] ?? "outline"}>
      <Icon aria-hidden className={statusIconClass(status)} />
      {statusLabel(status)}
    </Badge>
  );
}

function statusIcon(status: string) {
  if (["ACTIVE", "APPROVED", "DONE", "IN_PROGRESS", "PUBLISHED", "REVIEWED", "SUBMITTED"].includes(status)) {
    return CircleIcon;
  }
  if (["DRAFT", "TODO"].includes(status)) return CircleDotIcon;
  return CircleDashedIcon;
}

function statusIconClass(status: string) {
  return ["ACTIVE", "APPROVED", "DONE", "IN_PROGRESS", "PUBLISHED", "REVIEWED", "SUBMITTED"].includes(status)
    ? "fill-current"
    : undefined;
}

export { StatusBadge, statusLabel };
