import * as React from "react";

/**
 * Minimal, XSS-safe Markdown renderer for learning content and documentation.
 * Supports headings, paragraphs, lists, blockquotes, fenced code, rules, and
 * inline bold/italic/code/links. Raw HTML is never interpreted.
 */

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "code"; language: string; text: string }
  | { kind: "rule" };

function parseBlocks(source: string): Block[] {
  const lines = source.split(/\r?\n/);
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({
        kind: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2],
      });
      i++;
      continue;
    }

    if (/^(---+|\*\*\*+)\s*$/.test(line)) {
      blocks.push({ kind: "rule" });
      i++;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const buffer: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        buffer.push(lines[i]);
        i++;
      }
      i++; // closing fence (or end of input)
      blocks.push({ kind: "code", language, text: buffer.join("\n") });
      continue;
    }

    const bullet = /^\s*[-*]\s+/;
    const ordered = /^\s*\d+\.\s+/;
    if (bullet.test(line) || ordered.test(line)) {
      const isOrdered = ordered.test(line);
      const items: string[] = [];
      while (i < lines.length && (bullet.test(lines[i]) || ordered.test(lines[i]))) {
        items.push(lines[i].replace(isOrdered ? ordered : bullet, ""));
        i++;
      }
      blocks.push({ kind: "list", ordered: isOrdered, items });
      continue;
    }

    if (line.startsWith(">")) {
      const buffer: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        buffer.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ kind: "quote", text: buffer.join(" ") });
      continue;
    }

    const buffer = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|>|\s*[-*]\s|\s*\d+\.\s|---+)/.test(lines[i])) {
      buffer.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "paragraph", text: buffer.join(" ") });
  }

  return blocks;
}

const inlinePattern =
  /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\((?:https?:\/\/|\/)[^)\s]*\))/g;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(inlinePattern).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="bg-muted rounded px-1.5 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      return (
        <a
          key={key}
          href={link[2]}
          className="text-primary font-medium underline underline-offset-2"
          {...(link[2].startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);

  return (
    <div className="flex flex-col gap-4 text-sm leading-relaxed">
      {blocks.map((block, index) => {
        const key = `b${index}`;
        switch (block.kind) {
          case "heading": {
            const Tag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
            return (
              <Tag
                key={key}
                className={
                  block.level === 1
                    ? "text-xl font-semibold tracking-tight"
                    : block.level === 2
                      ? "mt-2 text-lg font-semibold tracking-tight"
                      : "mt-2 text-base font-semibold"
                }
              >
                {renderInline(block.text, key)}
              </Tag>
            );
          }
          case "paragraph":
            return <p key={key}>{renderInline(block.text, key)}</p>;
          case "rule":
            return <hr key={key} className="border-border" />;
          case "quote":
            return (
              <blockquote
                key={key}
                className="border-primary/40 text-muted-foreground border-l-2 pl-4 italic"
              >
                {renderInline(block.text, key)}
              </blockquote>
            );
          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag
                key={key}
                className={`ml-5 flex flex-col gap-1 ${block.ordered ? "list-decimal" : "list-disc"}`}
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
                ))}
              </Tag>
            );
          }
          case "code":
            return (
              <pre
                key={key}
                className="bg-muted overflow-x-auto rounded-lg p-4 font-mono text-xs leading-relaxed"
              >
                {block.language ? (
                  <span className="text-muted-foreground mb-2 block text-[10px] uppercase tracking-wide">
                    {block.language}
                  </span>
                ) : null}
                <code>{block.text}</code>
              </pre>
            );
        }
      })}
    </div>
  );
}
