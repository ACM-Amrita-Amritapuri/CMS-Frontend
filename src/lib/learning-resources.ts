const youtubeHosts = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const youtubeId = /^[A-Za-z0-9_-]{11}$/;

export function getYouTubeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    if (!youtubeHosts.has(hostname)) return null;

    const id = hostname === "youtu.be"
      ? url.pathname.split("/").filter(Boolean)[0]
      : url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).at(-1);
    return id && youtubeId.test(id)
      ? `https://www.youtube-nocookie.com/embed/${id}`
      : null;
  } catch {
    return null;
  }
}
