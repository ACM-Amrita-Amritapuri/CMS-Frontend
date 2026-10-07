import { Button } from "@/components/ui/button";

export function PaginationControls({
  label,
  offset,
  limit,
  total,
  onPageChange,
}: {
  label: string;
  offset: number;
  limit: number;
  total: number;
  onPageChange: (offset: number) => void;
}) {
  const first = total === 0 || offset >= total ? 0 : offset + 1;
  const last = offset >= total ? 0 : Math.min(offset + limit, total);

  return (
    <nav aria-label={`${label} pagination`} className="flex flex-wrap items-center justify-between gap-3">
      <p aria-live="polite" className="text-muted-foreground text-sm">
        Showing {first}–{last} of {total} {label.toLowerCase()}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={offset <= 0}
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          aria-label={`Previous ${label.toLowerCase()} page`}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={last >= total}
          onClick={() => onPageChange(offset + limit)}
          aria-label={`Next ${label.toLowerCase()} page`}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
