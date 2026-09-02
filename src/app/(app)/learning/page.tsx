import AppShell from "@/components/layout/AppShell";
import FeatureOverview from "@/components/layout/FeatureOverview";

export default function LearningPage() {
  return (
    <AppShell
      activeHref="/learning"
      eyebrow="Learning space"
      title="Build momentum with a clear next step."
      description="A focused home for the paths, resources, assignments, and progress that help members grow."
    >
      <FeatureOverview
        kicker="Learning space"
        title="Make progress visible, without making it noisy."
        description="The first release will connect learning paths to the member’s real progress and the club’s shared resources."
        items={[
          { label: "Paths", title: "Learning paths", description: "Guide members from first concepts to confident practice." },
          { label: "Work", title: "Assignments", description: "Keep the next piece of work easy to find and finish." },
          { label: "Progress", title: "Personal momentum", description: "See what is complete, current, and worth returning to." },
        ]}
        emptyTitle="Learning paths will appear here"
        emptyDescription="The learning API lands in the next implementation phase. This space is ready for its first connected content."
      />
    </AppShell>
  );
}
