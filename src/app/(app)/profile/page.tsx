import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import ProfileSummary from "@/components/member/ProfileSummary";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";
import { primaryMember } from "@/lib/prototype/content";

export default function ProfilePage() {
  return (
    <AppShell
      activeHref="/profile"
      eyebrow="My profile"
      title="Show the work behind the name."
      description="Your profile helps people find you, understand your interests, and join the work you care about."
    >
      <PrototypeNotice />
      <ProfileSummary editable member={primaryMember} />
      <div className="profile-grid">
        <section className="surface-card" aria-labelledby="profile-focus-title">
          <div className="card-heading"><div><span className="panel-kicker">Current focus</span><h2 id="profile-focus-title">What you are working on</h2></div><span className="badge">Active</span></div>
          <div className="focus-project"><span className="project-mark">W</span><div><strong>Website refresh</strong><span>Web Development · 4 collaborators</span></div><span className="progress-value">62%</span></div>
          <div className="progress-track"><span style={{ width: "62%" }} /></div>
          <Link className="card-link" href="/projects/website-refresh">Open project <span aria-hidden="true">↗</span></Link>
        </section>
        <section className="surface-card" aria-labelledby="profile-activity-title">
          <div className="card-heading"><div><span className="panel-kicker">Contribution history</span><h2 id="profile-activity-title">Recent activity</h2></div><span className="card-label">2026</span></div>
          <ul className="simple-list"><li><strong>Published a guide</strong><span>How we review project briefs · 2d ago</span></li><li><strong>Completed a lesson</strong><span>Accessible navigation · 5d ago</span></li><li><strong>Joined a project</strong><span>Website refresh · 1w ago</span></li></ul>
        </section>
      </div>
    </AppShell>
  );
}
