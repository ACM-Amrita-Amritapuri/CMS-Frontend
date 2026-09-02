import AppShell from "@/components/layout/AppShell";
import MemberCard from "@/components/member/MemberCard";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";
import { demoMembers } from "@/lib/prototype/content";

export default function MembersPage() {
  return (
    <AppShell
      activeHref="/members"
      eyebrow="Member directory"
      title="Find your people."
      description="Discover the people learning, building, and making the club what it is."
      actions={<button className="button-secondary" type="button">Invite a member</button>}
    >
      <PrototypeNotice />
      <div className="directory-toolbar">
        <label className="search-field" htmlFor="member-search">
          <span>Search members</span>
          <input id="member-search" placeholder="Name, roll number, or skill" />
        </label>
        <button className="button-secondary toolbar-filter" type="button"><span aria-hidden="true">☷</span><span>Filter members</span></button>
        <span className="result-count">24 members</span>
      </div>
      <div className="member-grid">
        {demoMembers.map((member) => <MemberCard key={member.id} member={member} />)}
      </div>
      <div className="directory-footer"><span>Showing 4 of 24 members</span><div><button className="icon-button" type="button" aria-label="Previous page">←</button><button className="icon-button" type="button" aria-label="Next page">→</button></div></div>
    </AppShell>
  );
}
