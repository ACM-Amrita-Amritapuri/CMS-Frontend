import { useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · ACM CMS` : "ACM CMS";
  }, [title]);
}
