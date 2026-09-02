import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";
import { demoDocuments } from "@/lib/prototype/content";

const document = demoDocuments[0];

export default function DocumentationDetailPage() {
  return (
    <AppShell activeHref="/documentation" eyebrow={`Guide · ${document.topic}`} title={document.title} description={document.summary} actions={<Link className="button-secondary" href="/documentation">Back to library</Link>}>
      <PrototypeNotice />
      <div className="article-layout">
        <article className="surface-card article-body"><div className="article-meta"><span className="badge">{document.topic}</span><span className="badge">{document.readTime}</span><span>{document.updated}</span><span>Owner: {document.owner}</span></div><p className="article-lede">{document.summary}</p><h2 id="brief">What makes a useful brief?</h2>{document.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<h2 id="checklist">Review checklist</h2><ul className="check-list"><li>Can a new contributor explain the problem in one sentence?</li><li>Is the first useful outcome small enough to learn from?</li><li>Does the team know what is explicitly out of scope?</li></ul><div className="article-footer"><span>Last reviewed by Web Development SIG</span><Link className="text-link" href="/documentation/review">Suggest an update →</Link></div></article>
        <aside className="surface-card toc"><span className="panel-kicker">On this page</span><h2>Contents</h2><ol><li><a href="#brief">What makes a useful brief?</a></li><li><a href="#checklist">Review checklist</a></li><li><a href="#related">Related docs</a></li></ol><div className="aside-note"><strong>Freshness signal</strong><span>Reviewed this month · 6 min read</span></div></aside>
      </div>
      <section className="surface-card related-panel" id="related" aria-labelledby="related-title"><div className="card-heading"><div><span className="panel-kicker">Keep reading</span><h2 id="related-title">Related documents</h2></div><Link className="text-link" href="/documentation">View library →</Link></div><div className="resource-grid"><Link href="/documentation/member-onboarding"><strong>Member onboarding checklist</strong><span>Club operations · 4 min read</span></Link><Link href="/documentation/accessible-ui-basics"><strong>Accessible UI basics</strong><span>Shared practice · 8 min read</span></Link></div></section>
    </AppShell>
  );
}
