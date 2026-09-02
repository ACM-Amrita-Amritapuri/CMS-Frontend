import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";

const accounts = [
  ["aanya@example.com", "Member", "Active", "Mar 08"],
  ["kabir@example.com", "SIG lead", "Active", "Mar 07"],
  ["ops@example.com", "Admin", "Active", "Feb 28"],
];

export default function AdminAccountsPage() {
  return (
    <AppShell activeHref="/admin" eyebrow="Administration · Access" title="Account & roles" description="Make access changes legible, deliberate, and recoverable." actions={<Link className="button" href="/admin/accounts">Create account</Link>}>
      <PrototypeNotice />
      <section className="surface-card admin-table-panel" aria-labelledby="accounts-table-title"><div className="card-heading"><div><span className="panel-kicker">Access control</span><h2 id="accounts-table-title">Keep roles close to the person.</h2></div><span className="badge">03 shown · 184 total</span></div><div className="table-wrap"><table><caption className="visually-hidden">Account and role management</caption><thead><tr><th scope="col">Account</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Last active</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead><tbody>{accounts.map(([email, role, status, lastActive]) => <tr key={email}><th scope="row">{email}</th><td><span className="role-label">{role}</span></td><td><span className="status-label">{status}</span></td><td>{lastActive}</td><td><button className="text-button" type="button">Reset password</button></td></tr>)}</tbody></table></div></section>
      <div className="content-two-column"><section className="surface-card one-time-secret"><span className="panel-kicker">One-time secret</span><h2>Never expose a password twice.</h2><p>When a reset is requested, show a one-time recovery state with clear expiry and copy guidance.</p></section><section className="surface-card reviewer-note"><span className="panel-kicker">Role safety</span><h2>Explain the impact.</h2><p>Role changes should say what the person can access before the action is confirmed.</p></section></div>
    </AppShell>
  );
}
