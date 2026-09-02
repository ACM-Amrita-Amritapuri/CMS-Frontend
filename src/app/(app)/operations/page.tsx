import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import ContentRow from "@/components/content/ContentRow";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";
import { demoAnnouncements, demoEvents } from "@/lib/prototype/content";

export default function OperationsPage() {
  return (
    <AppShell
      activeHref="/operations"
      eyebrow="Club operations"
      title="Keep the club moving with less friction."
      description="A practical home for announcements, events, meetings, and the small details that make community work."
    >
      <PrototypeNotice />
      <section className="content-hero operations-hero"><div><p className="panel-kicker">The week ahead</p><h2>Keep the rhythm visible.</h2><p>Important signals, gatherings, and decisions in one calm operational view.</p></div><Link className="button" href="/operations/calendar">Open calendar <span aria-hidden="true">↗</span></Link></section>
      <div className="content-stat-grid"><section className="surface-card"><span className="panel-kicker">Next event</span><strong className="content-stat">Mar 14</strong><span className="field-hint">Spring SIG kickoff</span></section><section className="surface-card"><span className="panel-kicker">Announcements</span><strong className="content-stat">02 new</strong><Link className="field-hint text-link" href="/operations/announcements">Read updates →</Link></section><section className="surface-card"><span className="panel-kicker">Attendance</span><strong className="content-stat">78%</strong><span className="field-hint">Average RSVP rate</span></section></div>
      <div className="content-two-column"><section className="surface-card content-row-panel" aria-labelledby="operations-events-title"><div className="card-heading"><div><span className="panel-kicker">Coming up</span><h2 id="operations-events-title">Upcoming events</h2></div><Link className="text-link" href="/operations/events">See all →</Link></div>{demoEvents.slice(0, 2).map((event) => <ContentRow key={event.title} href="/operations/events" title={event.title} category={event.kind} owner={event.location} updated={`${event.date} · ${event.time}`} status={event.attendees} />)}</section><section className="surface-card content-row-panel" aria-labelledby="operations-announcements-title"><div className="card-heading"><div><span className="panel-kicker">Latest signal</span><h2 id="operations-announcements-title">Announcements</h2></div><Link className="text-link" href="/operations/announcements">View all →</Link></div>{demoAnnouncements.slice(0, 2).map((announcement) => <ContentRow key={announcement.title} href="/operations/announcements" title={announcement.title} category={announcement.audience} owner={announcement.description} updated={announcement.date} status={announcement.status} />)}</section></div>
      <section className="empty-state compact-empty"><span className="empty-mark" aria-hidden="true">+</span><div><p className="panel-kicker">Planning state</p><h2>Keep an empty day calm.</h2><p>The calendar should make no-event days clear too, with a simple way to add or discover the next useful moment.</p></div></section>
    </AppShell>
  );
}
