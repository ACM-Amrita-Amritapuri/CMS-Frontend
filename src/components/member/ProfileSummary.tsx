import Link from "next/link";

import type { DemoMember } from "@/lib/prototype/content";

export default function ProfileSummary({ member, editable = false }: { member: DemoMember; editable?: boolean }) {
  return (
    <section className="profile-summary surface-card" aria-labelledby="profile-summary-title">
      <div className="profile-summary-header">
        <div className="profile-identity">
          <span className="avatar" aria-hidden="true">{member.initials}</span>
          <div>
            <p className="panel-kicker">{member.rollNumber}</p>
            <h2 id="profile-summary-title">{member.name}</h2>
            <p>{member.role} · {member.sig}</p>
          </div>
        </div>
        {editable ? <Link className="button-secondary" href="/profile/setup">Edit profile</Link> : null}
      </div>
      <p className="profile-bio">{member.bio}</p>
      <div className="profile-meta-grid">
        <div><span className="card-label">Location</span><strong>{member.location}</strong></div>
        <div><span className="card-label">Contact</span><a href={`mailto:${member.email}`}>{member.email}</a></div>
        <div><span className="card-label">Web</span><a href={`https://${member.website}`}>{member.website}</a></div>
      </div>
      <div className="tag-list">{member.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
    </section>
  );
}
