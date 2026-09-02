import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";
import { demoAnnouncements } from "@/lib/prototype/content";

export default function OperationsAnnouncementsPage() {
  return (
    <AppShell activeHref="/operations" eyebrow="Operations · Club signal" title="Announcements" description="Publish the information members need without losing it in a busy feed." actions={<Link className="button" href="/operations/announcements">Compose update</Link>}>
      <PrototypeNotice />
      <div className="filter-bar" aria-label="Announcement filters"><span className="filter-label">Show</span><Link className="filter-chip filter-chip-active" href="/operations/announcements">All updates <span>12</span></Link><Link className="filter-chip" href="/operations/announcements?status=published">Published <span>09</span></Link><Link className="filter-chip" href="/operations/announcements?status=draft">Drafts <span>03</span></Link></div>
      <section className="announcement-list" aria-labelledby="announcement-list-title"><div className="section-heading"><div><p className="eyebrow">Club signal</p><h2 id="announcement-list-title">Make the important stuff easy to find.</h2></div><span className="badge">All members</span></div>{demoAnnouncements.map((announcement) => <article className="surface-card announcement-card" key={announcement.title}><div className="announcement-date"><strong>{announcement.date}</strong><span>{announcement.audience}</span></div><div><div className="card-topline"><span className="card-label">{announcement.audience}</span><span className="badge">{announcement.status}</span></div><h3>{announcement.title}</h3><p>{announcement.description}</p><Link className="card-link" href="/operations/events">See related moment <span aria-hidden="true">↗</span></Link></div></article>)}</section>
      <section className="surface-card reviewer-note"><span className="panel-kicker">Publishing state</span><h2>Drafts need a clear owner.</h2><p>Show who can publish, who can edit, and what members will see while an announcement is waiting for approval.</p></section>
    </AppShell>
  );
}
