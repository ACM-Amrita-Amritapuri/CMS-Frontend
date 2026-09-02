import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";

export default function DocumentationReviewPage() {
  return (
    <AppShell activeHref="/documentation" eyebrow="Documentation · Editorial workflow" title="Review queue" description="Approve useful knowledge, ask focused questions, and keep ownership visible." actions={<Link className="button-secondary" href="/documentation">Back to library</Link>}>
      <PrototypeNotice />
      <div className="filter-bar" aria-label="Review filters"><span className="filter-label">Queue</span><Link className="filter-chip filter-chip-active" href="/documentation/review">Needs review <span>03</span></Link><Link className="filter-chip" href="/documentation/review?status=mine">Assigned to me <span>01</span></Link><Link className="filter-chip" href="/documentation/review?status=done">Recently reviewed</Link></div>
      <section className="surface-card review-panel" aria-labelledby="review-title"><div className="card-heading"><div><span className="panel-kicker">03 waiting</span><h2 id="review-title">Review with context.</h2></div><span className="badge">Web Development SIG</span></div><div className="review-item review-item-active"><div><span className="content-row-category">Submitted today · Aanya Sharma</span><h3>How we review project briefs</h3><p>A lightweight review rhythm for turning a promising idea into a brief a team can start with confidence.</p><div className="tag-list"><span>Web Development</span><span>6 min read</span><span>New draft</span></div></div><div className="review-actions"><Link className="button-secondary" href="/documentation/getting-started">Preview document</Link><button className="button" type="button">Approve document</button><button className="text-button" type="button">Request changes</button></div></div><div className="review-item"><div><span className="content-row-category">Submitted yesterday · Kabir Mehta</span><h3>Choosing a first issue</h3><p>How new contributors can find an issue with a clear scope and a welcoming maintainer.</p></div><span className="badge">Assigned to Meera</span></div><div className="review-item"><div><span className="content-row-category">Submitted Mar 08 · Operations team</span><h3>Event hosting checklist</h3><p>A small checklist for hosts before, during, and after a club event.</p></div><span className="badge">Unassigned</span></div></section>
      <section className="surface-card reviewer-note"><span className="panel-kicker">Reviewer guidance</span><h2>Approve the direction, not every detail.</h2><p>Use notes to explain a decision, and keep requested changes specific enough that the author can act without another meeting.</p></section>
    </AppShell>
  );
}
