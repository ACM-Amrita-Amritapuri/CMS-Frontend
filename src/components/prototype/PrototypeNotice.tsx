import Link from "next/link";

export default function PrototypeNotice() {
  return (
    <aside className="prototype-notice" aria-label="Prototype notice">
      <span className="prototype-notice-mark" aria-hidden="true">
        ◌
      </span>
      <div>
        <strong>Design prototype</strong>
        <p>Everything on these screens is mock data for layout and workflow review.</p>
      </div>
      <Link href="/prototype">View screen map</Link>
    </aside>
  );
}
