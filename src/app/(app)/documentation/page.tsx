import AppShell from "@/components/layout/AppShell";
import FeatureOverview from "@/components/layout/FeatureOverview";

export default function DocumentationPage() {
  return (
    <AppShell
      activeHref="/documentation"
      eyebrow="Knowledge base"
      title="Keep the useful things findable."
      description="A living library for club knowledge, shared practices, and the decisions that help the next person move faster."
    >
      <FeatureOverview
        kicker="Documentation"
        title="Write once. Help the whole club."
        description="The documentation space will make publishing, discovery, and editorial ownership part of the same workflow."
        items={[
          { label: "Library", title: "Document library", description: "Give every guide, note, and reference a clear home." },
          { label: "Find", title: "Fast discovery", description: "Search and browse by the way members actually work." },
          { label: "Care", title: "Editorial workflow", description: "Make ownership and review visible before knowledge goes stale." },
        ]}
        emptyTitle="The library is ready for its first document"
        emptyDescription="Connected documentation is planned for the next implementation phase, with permissions kept close to the backend contract."
      />
    </AppShell>
  );
}
