import Link from "next/link";

interface ContentRowProps {
  href: string;
  title: string;
  category: string;
  owner: string;
  updated: string;
  status?: string;
}

export default function ContentRow({ href, title, category, owner, updated, status }: ContentRowProps) {
  return (
    <Link className="content-row" href={href}>
      <span className="content-row-main">
        <span className="content-row-category">{category}</span>
        <strong>{title}</strong>
        <span>{owner}</span>
      </span>
      <span className="content-row-meta">
        {status ? <span className="badge">{status}</span> : null}
        <span>{updated}</span>
        <span className="content-row-arrow" aria-hidden="true">↗</span>
      </span>
    </Link>
  );
}
