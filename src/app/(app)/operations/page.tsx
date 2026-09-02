import AppShell from "@/components/layout/AppShell";
import FeatureOverview from "@/components/layout/FeatureOverview";

export default function OperationsPage() {
  return (
    <AppShell
      activeHref="/operations"
      eyebrow="Club operations"
      title="Keep the club moving with less friction."
      description="A practical home for announcements, events, meetings, and the small details that make community work."
    >
      <FeatureOverview
        kicker="Operations"
        title="The rhythm of the club, in one view."
        description="Operations will turn recurring coordination into a visible, dependable part of the shared workspace."
        items={[
          { label: "Signal", title: "Announcements", description: "Share the information members need without losing it in a feed." },
          { label: "Gather", title: "Events and meetings", description: "Make the next moment together easy to understand and attend." },
          { label: "Plan", title: "Club calendar", description: "Give teams one reliable view of what is happening and when." },
        ]}
        emptyTitle="Operations will appear here"
        emptyDescription="Live announcements and scheduling are intentionally left for the operations API phase, so the UI will match real permissions."
      />
    </AppShell>
  );
}
