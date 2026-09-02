import AppShell from "@/components/layout/AppShell";
import FeatureOverview from "@/components/layout/FeatureOverview";

export default function ProjectsPage() {
  return (
    <AppShell
      activeHref="/projects"
      eyebrow="Projects space"
      title="Turn good ideas into visible work."
      description="A shared view for projects, teams, and the outcomes the club is proud to put into the world."
    >
      <FeatureOverview
        kicker="Projects"
        title="Make collaboration easier to join."
        description="Projects will bring the idea, the people, and the next useful action into one understandable surface."
        items={[
          { label: "Discover", title: "Project gallery", description: "See what is being explored, built, and shipped." },
          { label: "People", title: "Teams and roles", description: "Know who is involved and where a helping hand fits." },
          { label: "Outcome", title: "Showcase work", description: "Give finished projects a place to teach and inspire." },
        ]}
        emptyTitle="Projects will appear here"
        emptyDescription="The project model and connected listings are scheduled after the shared workspace foundation."
      />
    </AppShell>
  );
}
