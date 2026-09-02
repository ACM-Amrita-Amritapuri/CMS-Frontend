import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { href: string; label: string };
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="empty-state" aria-labelledby="empty-state-title">
      <span className="empty-mark" aria-hidden="true">
        —
      </span>
      <div>
        <p className="panel-kicker">Nothing here yet</p>
        <h2 id="empty-state-title">{title}</h2>
        <p>{description}</p>
        {action ? (
          <Link className="button-secondary" href={action.href}>
            {action.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
