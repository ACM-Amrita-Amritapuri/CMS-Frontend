import { describe, expect, it } from "vitest";

import { getYouTubeEmbedUrl } from "@/lib/learning-resources";

describe("getYouTubeEmbedUrl", () => {
  it("turns supported YouTube URLs into no-cookie embed URLs", () => {
    expect(getYouTubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    expect(getYouTubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });

  it("rejects non-YouTube URLs and malformed video IDs", () => {
    expect(getYouTubeEmbedUrl("https://example.com/video")).toBeNull();
    expect(getYouTubeEmbedUrl("https://www.youtube.com/watch?v=too-short")).toBeNull();
  });
});
