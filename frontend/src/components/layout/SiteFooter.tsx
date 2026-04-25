const footerLinks = [
  "Shipping",
  "Returns",
  "Privacy",
  "Terms",
  "Contact",
];

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-950 text-stone-200">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-12 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
            Duocmeta Storefront
          </p>
          <p className="text-sm leading-6 text-stone-300">
            Production-grade ecommerce foundation focused on fast public pages, clean catalog browsing,
            and backend-owned commerce rules.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-4 text-sm text-stone-300">
          {footerLinks.map((label) => (
            <a key={label} href="/" className="transition hover:text-white">
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
