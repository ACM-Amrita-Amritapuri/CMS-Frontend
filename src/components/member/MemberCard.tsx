import Link from "next/link";

import type { DemoMember } from "@/lib/prototype/content";

export default function MemberCard({ member }: { member: DemoMember }) {
  return (
    <article className="member-card surface-card">
      <div className="member-card-header">
        <span className="avatar avatar-small" aria-hidden="true">{member.initials}</span>
        <span className={`availability availability-${member.availability.toLowerCase().replaceAll(" ", "-")}`}>
          <span className="status-dot" aria-hidden="true" />
          {member.availability}
        </span>
      </div>
      <h2>{member.name}</h2>
      <p className="member-role">{member.role} · {member.sig}</p>
      <p className="member-bio">{member.bio}</p>
      <div className="tag-list">{member.skills.slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}</div>
      <Link className="card-link" href={`/members/${member.rollNumber}`}>
        View profile <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}
