import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";
import { demoMembers } from "@/lib/prototype/content";

export default function AdminMembersPage() {
  return (
    <AppShell activeHref="/admin" eyebrow="Administration · Membership" title="Member management" description="Search, filter, and maintain member accounts without losing the human context behind each row.">
      <PrototypeNotice />
      <div className="admin-toolbar"><label className="visually-hidden" htmlFor="member-admin-search">Search members</label><input id="member-admin-search" type="search" placeholder="Search name or roll number" /><div className="filter-bar"><Link className="filter-chip filter-chip-active" href="/admin/members">All <span>184</span></Link><Link className="filter-chip" href="/admin/members?status=pending">Pending <span>03</span></Link><Link className="filter-chip" href="/admin/members?status=inactive">Inactive <span>12</span></Link></div></div>
      <section className="surface-card admin-table-panel" aria-labelledby="members-table-title"><div className="card-heading"><div><span className="panel-kicker">Member accounts</span><h2 id="members-table-title">Manage with enough context.</h2></div><span className="badge">184 active</span></div><div className="table-wrap"><table><caption className="visually-hidden">Member account management</caption><thead><tr><th scope="col">Member</th><th scope="col">Roll number</th><th scope="col">SIG</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead><tbody>{demoMembers.map((member) => <tr key={member.rollNumber}><th scope="row"><Link href={`/members/${member.rollNumber}`}>{member.name}</Link></th><td>{member.rollNumber}</td><td>{member.sig}</td><td><span className="status-label">Active</span></td><td><Link className="text-link" href={`/members/${member.rollNumber}`}>View</Link></td></tr>)}</tbody></table></div></section>
      <section className="surface-card confirmation-panel"><span className="panel-kicker">Confirmation state</span><h2>Deactivation needs a second look.</h2><p>For destructive account actions, name the impact, ask for confirmation, and keep the recovery path visible.</p></section>
    </AppShell>
  );
}
