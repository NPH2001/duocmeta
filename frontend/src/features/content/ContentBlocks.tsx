import type { ReactNode } from "react";

type ContentBlock = {
  type?: unknown;
  text?: unknown;
  level?: unknown;
  items?: unknown;
  caption?: unknown;
};

export function ContentBlocks({ content }: { content: Record<string, unknown> }) {
  const blocks = Array.isArray(content.blocks) ? content.blocks : null;

  if (!blocks || blocks.length === 0) {
    return (
      <pre className="overflow-x-auto rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm leading-7 text-stone-700">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  }

  return (
    <>
      {blocks.map((block, index) => (
        <ContentBlockRenderer key={index} block={block} />
      ))}
    </>
  );
}

function ContentBlockRenderer({ block }: { block: unknown }) {
  if (!isObject(block)) {
    return <p>{String(block)}</p>;
  }

  const typedBlock = block as ContentBlock;
  const type = typeof typedBlock.type === "string" ? typedBlock.type : "paragraph";
  const text = typeof typedBlock.text === "string" ? typedBlock.text : "";

  if (type === "heading") {
    const level = typedBlock.level === 3 ? 3 : 2;
    const className = "pt-4 text-2xl leading-tight text-stone-950 md:text-3xl";

    return level === 3 ? <h3 className={className}>{text}</h3> : <h2 className={className}>{text}</h2>;
  }

  if (type === "list" && Array.isArray(typedBlock.items)) {
    return (
      <ul className="list-disc space-y-2 pl-6">
        {typedBlock.items.map((item, index) => (
          <li key={index}>{String(item)}</li>
        ))}
      </ul>
    );
  }

  if (type === "quote") {
    return (
      <blockquote className="border-l-4 border-emerald-700 bg-emerald-50 px-5 py-4 text-stone-800">
        {text}
      </blockquote>
    );
  }

  if (type === "image") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-600">
        {typeof typedBlock.caption === "string" ? typedBlock.caption : "Image block"}
      </div>
    );
  }

  return <p>{text || renderFallbackBlock(typedBlock)}</p>;
}

function renderFallbackBlock(block: ContentBlock): ReactNode {
  return JSON.stringify(block);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
