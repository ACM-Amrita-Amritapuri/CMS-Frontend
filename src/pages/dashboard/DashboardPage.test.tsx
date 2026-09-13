import { describe, expect, it } from "vitest";

import { dashboardHeroClassName } from "@/pages/dashboard/DashboardPage";

describe("dashboard hero theme", () => {
  it("keeps the dark dashboard hero on an elevated dark surface", () => {
    expect(dashboardHeroClassName).toContain("dark:bg-[#111111]");
    expect(dashboardHeroClassName).toContain("dark:text-white");
    expect(dashboardHeroClassName).toContain("dark:border-white/10");
  });
});
