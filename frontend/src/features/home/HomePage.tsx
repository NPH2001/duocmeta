const categories = [
  {
    title: "Daily Essentials",
    description: "Core products positioned for repeat purchase and fast decision-making.",
  },
  {
    title: "Clinical Picks",
    description: "Editorially highlighted catalog areas ready to become API-driven collections later.",
  },
  {
    title: "Seasonal Care",
    description: "Flexible campaign surface for rotating hero categories and landing experiences.",
  },
];

const highlights = [
  {
    eyebrow: "Featured Product Line",
    title: "Calm routines built for high-intent shoppers",
    description:
      "Structured product storytelling space for the eventual catalog API, keeping merchandising and pricing sourced from the backend.",
  },
  {
    eyebrow: "Editorial Slot",
    title: "Trust signals, guidance, and conversion support",
    description:
      "Reusable section for pharmacist notes, fulfillment promises, and content-led conversion messaging.",
  },
  {
    eyebrow: "Launch Rail",
    title: "Fast campaign updates without layout rewrites",
    description:
      "Homepage cards stay flexible so later CMS and catalog modules can populate them without redesigning the shell.",
  },
];


export function HomePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-20 px-6 py-16 md:py-24">
      <section className="grid gap-10 lg:grid-cols-[1.35fr_0.9fr] lg:items-end">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
            Public Storefront MVP
          </p>
          <h1 className="max-w-4xl text-5xl leading-tight text-stone-950 md:text-7xl">
            A faster ecommerce front door with backend-owned commerce rules.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-stone-600">
            The homepage shell is live and ready for catalog-driven merchandising. Public pages stay optimized
            for search while pricing, stock, and checkout authority remain on the backend.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="/products"
              className="rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white"
            >
              Browse Catalog
            </a>
            <a
              href="/blog"
              className="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-700"
            >
              Read Guidance
            </a>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,238,226,0.92))] p-8 shadow-[0_32px_80px_rgba(28,25,23,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">Homepage Signals</p>
          <dl className="mt-8 grid gap-6">
            <div>
              <dt className="text-sm font-medium text-stone-500">Rendering model</dt>
              <dd className="mt-2 text-2xl text-stone-950">SSR / ISR ready</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-stone-500">Commerce authority</dt>
              <dd className="mt-2 text-2xl text-stone-950">Backend source of truth</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-stone-500">Layout role</dt>
              <dd className="mt-2 text-2xl text-stone-950">SEO-first public shell</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">Category Highlights</p>
            <h2 className="text-3xl text-stone-950 md:text-4xl">A homepage that can flex with catalog growth.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-stone-600">
            These cards are static placeholders for now and are intentionally free of frontend-owned pricing or
            inventory rules.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.title}
              className="rounded-[1.75rem] border border-stone-200 bg-white/85 p-7 shadow-[0_18px_50px_rgba(28,25,23,0.05)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Category</p>
              <h3 className="mt-5 text-2xl text-stone-950">{category.title}</h3>
              <p className="mt-4 text-sm leading-7 text-stone-600">{category.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {highlights.map((highlight) => (
          <article
            key={highlight.title}
            className="rounded-[1.75rem] border border-stone-200 bg-stone-950 p-7 text-stone-100"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-400">
              {highlight.eyebrow}
            </p>
            <h2 className="mt-5 text-2xl leading-tight">{highlight.title}</h2>
            <p className="mt-4 text-sm leading-7 text-stone-300">{highlight.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
