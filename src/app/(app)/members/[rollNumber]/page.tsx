import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import ProfileSummary from "@/components/member/ProfileSummary";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";
import { primaryMember } from "@/lib/prototype/content";

export default function MemberDetailPage() {
  return (
    <AppShell
      activeHref="/members"
      eyebrow="Member profile · ACM-024"
      title="Aanya Sharma’s profile"
      description="A public view of a member’s interests, club contributions, and current work."
      actions={<Link className="button-secondary" href="/portfolio/42">View portfolio</Link>}
    >
      <PrototypeNotice />
      <ProfileSummary member={primaryMember} />
      <div className="profile-grid member-detail-grid">
        <section className="surface-card" aria-labelledby="about-aanya-title"><span className="panel-kicker">About</span><h2 id="about-aanya-title">About Aanya</h2><p className="large-copy">{primaryMember.bio}</p><div className="tag-list">{primaryMember.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section>
        <section className="surface-card" aria-labelledby="member-learning-title"><div className="card-heading"><div><span className="panel-kicker">Learning</span><h2 id="member-learning-title">Recent progress</h2></div><span className="badge">3 paths</span></div><ul className="simple-list"><li><strong>Frontend foundations</strong><span>6 of 8 lessons complete</span></li><li><strong>Writing useful documentation</strong><span>Started this week</span></li></ul></section>
        <section className="surface-card" aria-labelledby="member-projects-title"><div className="card-heading"><div><span className="panel-kicker">Projects</span><h2 id="member-projects-title">Work in motion</h2></div><span className="badge">2 active</span></div><ul className="simple-list"><li><strong>Website refresh</strong><span>Web Development · Lead</span></li><li><strong>New member welcome kit</strong><span>Operations · Contributor</span></li></ul></section>
      </div>
    </AppShell>
  );
}
