import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";

const days = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];

export default function OperationsCalendarPage() {
  return (
    <AppShell activeHref="/operations" eyebrow="Operations · Shared calendar" title="Club calendar" description="Give teams one reliable view of what is happening and when." actions={<Link className="button" href="/operations/events">Browse events</Link>}>
      <PrototypeNotice />
      <section className="calendar-shell surface-card" aria-labelledby="calendar-title"><div className="calendar-toolbar"><div><p className="panel-kicker">Month view</p><h2 id="calendar-title">March 2026</h2></div><div className="calendar-controls"><button className="button-secondary" type="button" aria-label="Previous month">←</button><button className="button-secondary" type="button">Today</button><button className="button-secondary" type="button" aria-label="Next month">→</button></div></div><div className="calendar-weekdays"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div><div className="calendar-grid">{days.map((day) => <div className={`calendar-day${day === "14" ? " calendar-day-event" : ""}${day === "18" ? " calendar-day-workshop" : ""}`} key={day}><strong>{day}</strong>{day === "14" ? <span>Spring SIG kickoff</span> : null}{day === "18" ? <span>Brief clinic</span> : null}{day === "28" ? <span>Project demos</span> : null}</div>)}</div></section>
      <div className="calendar-legend"><span><i className="legend-dot legend-community" />Community</span><span><i className="legend-dot legend-workshop" />Workshop</span><span><i className="legend-dot legend-showcase" />Showcase</span></div>
      <section className="surface-card day-detail"><div className="card-heading"><div><span className="panel-kicker">Selected day · Saturday, March 14</span><h2>Three useful ways to show up.</h2></div><Link className="text-link" href="/operations/events">See event details →</Link></div><p className="large-copy">The calendar preview should keep a selected day legible on desktop, then become a simple agenda on smaller screens.</p></section>
    </AppShell>
  );
}
