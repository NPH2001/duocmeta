const dashboardItems = [
  { label: "Products", value: "Catalog", description: "Manage product records and publication state." },
  { label: "Orders", value: "Operations", description: "Review customer orders and fulfillment workflow." },
  { label: "Inventory", value: "Stock", description: "Track variant availability and manual adjustments." },
];

export function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
          Admin
        </p>
        <h1 className="mt-3 text-4xl leading-tight text-stone-950">Commerce dashboard</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
          Administrative routes are guarded by backend RBAC before rendering commerce tools.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {dashboardItems.map((item) => (
          <article className="rounded-2xl border border-stone-200 bg-white p-5" key={item.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              {item.label}
            </p>
            <h2 className="mt-3 text-2xl text-stone-950">{item.value}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
