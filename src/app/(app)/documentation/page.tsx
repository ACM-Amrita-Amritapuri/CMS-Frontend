import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import ContentRow from "@/components/content/ContentRow";
import PrototypeNotice from "@/components/prototype/PrototypeNotice";
import { demoDocuments } from "@/lib/prototype/content";

export default function DocumentationPage() {
  return (
    <AppShell
      activeHref="/documentation"
      eyebrow="Knowledge base"
      title="Find what the club knows."
      description="A living library for club knowledge, shared practices, and the decisions that help the next person move faster."
    >
      <PrototypeNotice />
      <section className="content-hero docs-hero" aria-labelledby="docs-hero-title"><div><p className="panel-kicker">Shared knowledge</p><h2 id="docs-hero-title">Write once. Help the whole club.</h2><p>Find the guide you need, understand who owns it, and leave the library a little better than you found it.</p></div><Link className="button" href="/documentation/new">Create document <span aria-hidden="true">↗</span></Link></section>
      <section className="surface-card library-panel" aria-labelledby="library-title"><div className="section-heading"><div><p className="eyebrow">Document library</p><h2 id="library-title">Start with a search.</h2></div><span className="badge">24 published</span></div><div className="search-row"><label className="visually-hidden" htmlFor="documentation-search">Search documentation</label><input id="documentation-search" type="search" placeholder="Search guides, practices, and notes" /><button className="button-secondary" type="button">Search</button></div><div className="filter-bar" aria-label="Documentation topics"><span className="filter-label">Browse by</span><Link className="filter-chip filter-chip-active" href="/documentation">All topics <span>24</span></Link><Link className="filter-chip" href="/documentation?topic=web">Web Development <span>08</span></Link><Link className="filter-chip" href="/documentation?topic=ops">Operations <span>05</span></Link><Link className="filter-chip" href="/documentation?topic=shared">Shared practice <span>11</span></Link></div><div className="content-row-list">{demoDocuments.map((document) => <ContentRow key={document.slug} href={`/documentation/${document.slug}`} title={document.title} category={document.topic} owner={document.owner} updated={document.updated} status={document.readTime} />)}</div></section>
      <section className="empty-state compact-empty"><span className="empty-mark" aria-hidden="true">⌕</span><div><p className="panel-kicker">Search state</p><h2>No results is a useful state.</h2><p>When a query has no match, offer a reset, a suggestion, or a clear path to create the missing knowledge.</p></div></section>
    </AppShell>
  );
}
