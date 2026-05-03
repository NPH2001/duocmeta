import Image from "next/image";
import type { ReactNode } from "react";

type ContentBlock = {
  type?: unknown;
  text?: unknown;
  level?: unknown;
  items?: unknown;
  alt?: unknown;
  caption?: unknown;
  height?: unknown;
  src?: unknown;
  url?: unknown;
  width?: unknown;
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
    const src = getString(typedBlock.src) ?? getString(typedBlock.url);
    const alt = getString(typedBlock.alt) ?? getString(typedBlock.caption) ?? "Content image";
    const width = getPositiveNumber(typedBlock.width) ?? 1200;
    const height = getPositiveNumber(typedBlock.height) ?? 675;

    if (!src) {
      return (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-600">
          {typeof typedBlock.caption === "string" ? typedBlock.caption : "Image block"}
        </div>
      );
    }

    return (
      <figure className="space-y-3">
        <Image
          alt={alt}
          className="h-auto w-full rounded-2xl border border-stone-200 object-cover"
          height={height}
          loading="lazy"
          sizes="(min-width: 1024px) 896px, calc(100vw - 48px)"
          src={src}
          width={width}
        />
        {typeof typedBlock.caption === "string" ? (
          <figcaption className="text-sm text-stone-500">{typedBlock.caption}</figcaption>
        ) : null}
      </figure>
    );
  }

  return <p>{text || renderFallbackBlock(typedBlock)}</p>;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getPositiveNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

function renderFallbackBlock(block: ContentBlock): ReactNode {
  return JSON.stringify(block);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
