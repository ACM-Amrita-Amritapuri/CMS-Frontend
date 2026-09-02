import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";
import { demoEvents } from "@/lib/prototype/content";

export default function OperationsEventsPage() {
  return (
    <AppShell activeHref="/operations" eyebrow="Operations · Gatherings" title="Events & meetings" description="Make the next moment together easy to understand, attend, and remember." actions={<Link className="button" href="/operations/events">Create event</Link>}>
      <PrototypeNotice />
      <div className="filter-bar" aria-label="Event filters"><span className="filter-label">Browse</span><Link className="filter-chip filter-chip-active" href="/operations/events">Upcoming <span>03</span></Link><Link className="filter-chip" href="/operations/events?type=workshop">Workshops</Link><Link className="filter-chip" href="/operations/events?type=community">Community</Link><Link className="filter-chip" href="/operations/calendar">Calendar view</Link></div>
      <section className="event-grid" aria-labelledby="event-list-title"><div className="section-heading"><div><p className="eyebrow">Upcoming gatherings</p><h2 id="event-list-title">Choose how you want to join.</h2></div><span className="badge">March 2026</span></div><div className="event-card-grid">{demoEvents.map((event) => <article className="surface-card event-card" key={event.title}><div className="event-date"><strong>{event.date.split(" ")[1]}</strong><span>{event.date.split(" ")[0]}</span></div><div className="card-topline"><span className="card-label">{event.kind}</span><span className="badge">{event.attendees}</span></div><h2>{event.title}</h2><p>{event.description}</p><div className="event-meta"><span>{event.time}</span><span>{event.location}</span></div><button className="button-secondary" type="button">RSVP · I’m going</button></article>)}</div></section>
      <section className="empty-state compact-empty"><span className="empty-mark" aria-hidden="true">⌁</span><div><p className="panel-kicker">Attendance state</p><h2>Make RSVP reversible.</h2><p>Members should be able to change their response, see location details, and understand who else is joining without friction.</p></div></section>
    </AppShell>
  );
}
