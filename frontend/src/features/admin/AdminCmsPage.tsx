import Link from "next/link";

const cmsSections = [
  { href: "/admin/cms/pages", title: "Pages", description: "Create and update CMS page records." },
  { href: "/admin/cms/posts", title: "Posts", description: "Manage editorial posts and publication state." },
  { href: "/admin/cms/seo", title: "SEO metadata", description: "Maintain backend-owned index metadata." },
  { href: "/admin/cms/redirects", title: "Redirects", description: "Manage public redirect rules." },
];

export function AdminCmsPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">CMS</p>
        <h1 className="mt-3 text-4xl leading-tight text-stone-950">Content operations</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
          Manage content records through backend admin CMS APIs. Publication, SEO, and redirect rules
          are submitted to the backend for validation and persistence.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {cmsSections.map((section) => (
          <Link
            className="rounded-2xl border border-stone-200 bg-white p-5 hover:border-stone-400"
            href={section.href}
            key={section.href}
          >
            <h2 className="text-xl text-stone-950">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">{section.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
