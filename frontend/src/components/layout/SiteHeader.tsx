const navItems = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/brands", label: "Brands" },
  { href: "/blog", label: "Journal" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
        <div className="flex items-center gap-4">
          <a href="/" className="text-lg font-semibold uppercase tracking-[0.35em] text-stone-900">
            Duocmeta
          </a>
          <nav aria-label="Primary" className="hidden gap-5 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-stone-600 transition hover:text-stone-950"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <form className="flex w-full max-w-sm items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-4 py-3">
          <input
            type="search"
            placeholder="Search products, brands, articles"
            className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
          />
          <button
            type="submit"
            className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            Search
          </button>
        </form>
      </div>
    </header>
  );
}
