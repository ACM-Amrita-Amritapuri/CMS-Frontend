import EmptyState from "@/components/ui/EmptyState";

interface FeatureItem {
  label: string;
  title: string;
  description: string;
}

interface FeatureOverviewProps {
  kicker: string;
  title: string;
  description: string;
  items: FeatureItem[];
  emptyTitle: string;
  emptyDescription: string;
}

export default function FeatureOverview({
  kicker,
  title,
  description,
  items,
  emptyTitle,
  emptyDescription,
}: FeatureOverviewProps) {
  return (
    <>
      <section className="feature-banner" aria-labelledby="feature-banner-title">
        <div>
          <p className="panel-kicker">{kicker}</p>
          <h2 id="feature-banner-title">{title}</h2>
          <p>{description}</p>
        </div>
        <span className="badge">Coming next</span>
      </section>

      <div className="feature-grid">
        {items.map((item, index) => (
          <article className="surface-card feature-card" key={item.label}>
            <div className="card-topline">
              <span className="card-index">0{index + 1}</span>
              <span className="card-label">{item.label}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>

      <EmptyState title={emptyTitle} description={emptyDescription} />
    </>
  );
}
