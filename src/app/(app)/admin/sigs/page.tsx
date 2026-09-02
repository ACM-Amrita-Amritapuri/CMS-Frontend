import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";

const sigs = [
  ["Web Development", "Aanya Sharma", "42 members", "Healthy"],
  ["Artificial Intelligence", "Kabir Mehta", "31 members", "Healthy"],
  ["Design & Media", "Meera Iyer", "27 members", "Needs lead"],
  ["Open Source", "Rohan Das", "22 members", "Healthy"],
];

export default function AdminSigsPage() {
  return (
    <AppShell activeHref="/admin" eyebrow="Administration · Special Interest Groups" title="SIG management" description="Keep each group’s purpose, lead, and membership context easy to maintain." actions={<Link className="button" href="/admin/sigs">Create SIG</Link>}>
      <PrototypeNotice />
      <div className="admin-toolbar"><label className="visually-hidden" htmlFor="sig-search">Search SIGs</label><input id="sig-search" type="search" placeholder="Search SIGs" /><div className="filter-bar"><Link className="filter-chip filter-chip-active" href="/admin/sigs">All <span>08</span></Link><Link className="filter-chip" href="/admin/sigs?status=needs-lead">Needs attention <span>01</span></Link></div></div>
      <section className="surface-card admin-table-panel" aria-labelledby="sigs-table-title"><div className="card-heading"><div><span className="panel-kicker">Special Interest Groups</span><h2 id="sigs-table-title">Give every group a clear home.</h2></div><span className="badge">08 total</span></div><div className="table-wrap"><table><caption className="visually-hidden">Special Interest Groups and leads</caption><thead><tr><th scope="col">SIG</th><th scope="col">Lead</th><th scope="col">Members</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead><tbody>{sigs.map(([name, lead, members, status]) => <tr key={name}><th scope="row">{name}</th><td>{lead}</td><td>{members}</td><td><span className={`status-label${status === "Needs lead" ? " status-label-warning" : ""}`}>{status}</span></td><td><Link className="text-link" href="/admin/sigs">Edit</Link></td></tr>)}</tbody></table></div></section>
      <section className="surface-card conflict-panel"><span className="panel-kicker">Conflict state</span><h2>Lead assignment should be explicit.</h2><p>When a lead leaves or two people are assigned, show the conflict before it changes the public SIG surface.</p></section>
    </AppShell>
  );
}
